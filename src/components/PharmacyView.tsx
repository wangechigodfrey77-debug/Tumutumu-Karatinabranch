/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Pill, RotateCcw, Plus, ShoppingBag, PackageOpen, AlertTriangle, TrendingUp, CalendarDays, Upload, FileSpreadsheet, FileText, Check, Loader2, Search, X, Download, Stethoscope, Lock, Shield, Clock } from 'lucide-react';
import { MedicationDispense, PharmacyItem, Patient, MedicalRecord } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { archiveDailyPharmacyData, getSystemConfigLastReset, saveSystemConfigLastReset } from '../dbService';

interface PharmacyViewProps {
  stock: PharmacyItem[];
  dispenses: MedicationDispense[];
  patients: Patient[];
  userEmail: string;
  userName: string;
  onDispenseMedication: (dispense: MedicationDispense) => void;
  onRestockItem: (itemId: string, qty: number) => void;
  onAddNewStockItem: (item: PharmacyItem) => void;
  onUpdateThreshold?: (itemId: string, threshold: number) => void;
  onAddPatient?: (patient: Patient) => void;
  onUpdatePatientHistory?: (patientId: string, history: MedicalRecord[]) => void;
}

export function PharmacyView({
  stock,
  dispenses,
  patients,
  userEmail,
  userName,
  onDispenseMedication,
  onRestockItem,
  onAddNewStockItem,
  onUpdateThreshold,
  onAddPatient,
  onUpdatePatientHistory,
}: PharmacyViewProps) {
  const [dispensePatientId, setDispensePatientId] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [dispenseQuantity, setDispenseQuantity] = useState<number>(1);
  const [dispensingOfficer, setDispensingOfficer] = useState<string>(userName || 'Susan Muthoni');

  // Walk-in Registration states
  const [isRegisteringWalkIn, setIsRegisteringWalkIn] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInAge, setWalkInAge] = useState<number>(30);
  const [walkInGender, setWalkInGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [walkInPhone, setWalkInPhone] = useState<string>('');

  const handleCreateWalkIn = () => {
    if (!walkInName.trim()) {
      alert("Please provide the walk-in patient's full name.");
      return;
    }
    const yearMonth = new Date().toISOString().substring(0, 7);
    const randId = Math.floor(1000 + Math.random() * 9000);
    const newPatient: Patient = {
      id: `PT-${randId}`,
      opNumber: `OP-${yearMonth}-${randId}`,
      name: walkInName.trim(),
      age: Number(walkInAge),
      gender: walkInGender,
      phone: walkInPhone.trim() || 'N/A',
      category: 'General Consultation',
      registeredAt: new Date().toISOString(),
      registeredBy: userEmail || 'pharmacy_tech@tumutumu.org',
      medicalHistory: [],
      isWalkIn: true,
      walkInTag: 'Pharmacy Walk-In'
    };

    if (onAddPatient) {
      onAddPatient(newPatient);
      setDispensePatientId(newPatient.id);
      setNonPharmaPatientId(newPatient.id);
      setIsRegisteringWalkIn(false);
      // Reset walk-in form
      setWalkInName('');
      setWalkInAge(30);
      setWalkInGender('Male');
      setWalkInPhone('');
    } else {
      alert("Patient registration hook not configured in application root.");
    }
  };

  const handleDispensePrescription = (patientId: string, recordId: string) => {
    if (!onUpdatePatientHistory) {
      alert("Database error: patient updater callbacks are unconfigured.");
      return;
    }
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      alert("Error: Patient records do not exist for this ID!");
      return;
    }
    const record = patient.medicalHistory?.find(r => r.id === recordId);
    if (!record || !record.prescribedItems || record.prescribedItems.length === 0) {
      alert("Error: No prescribed medication items found in clinical history!");
      return;
    }

    // Check stock for ALL items in prescription
    const stockErrors: string[] = [];
    const validatedItems = record.prescribedItems.map(pItem => {
      const sItem = stock.find(s => s.id === pItem.itemId || s.name === pItem.name);
      if (!sItem) {
        stockErrors.push(`Medication "${pItem.name}" is no longer inside pharmacy stock catalog.`);
        return null;
      }
      if (sItem.stockQuantity < pItem.quantity) {
        stockErrors.push(`Insufficient stock for "${pItem.name}". Requires ${pItem.quantity} units, but only ${sItem.stockQuantity} remains.`);
      }
      return { sItem, ...pItem };
    });

    if (stockErrors.length > 0) {
      alert(`Dispensation blocked by stock constraints:\n${stockErrors.join('\n')}`);
      return;
    }

    // Process dispenses
    validatedItems.forEach((info, idx) => {
      if (!info) return;
      const newD: MedicationDispense = {
        id: `DSP-${Date.now()}-${idx}`,
        medicationName: info.name,
        patientId,
        patientName: patient.name,
        dispenseDate: new Date().toISOString().split('T')[0],
        dispensedBy: dispensingOfficer || 'Pharmacist Officer',
        quantity: info.quantity,
        pricePerUnit: info.price,
        totalCost: info.quantity * info.price
      };
      onDispenseMedication(newD);
    });

    // Mark as Dispensed
    const updatedHistory = (patient.medicalHistory || []).map(r => {
      if (r.id === recordId) {
        return { ...r, billingStatus: 'Dispensed' as const };
      }
      return r;
    });

    onUpdatePatientHistory(patientId, updatedHistory);
    alert(`Success: Prescribed medicines dispensed and stock deducted successfully for patient: ${patient.name}.`);
  };

  const handlePayPrescriptionFromPharmacy = (patientId: string, recordId: string) => {
    if (!onUpdatePatientHistory) return;
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const updatedHistory = (patient.medicalHistory || []).map(record => {
      if (record.id === recordId) {
        return { ...record, billingStatus: 'Paid' as const };
      }
      return record;
    });

    onUpdatePatientHistory(patientId, updatedHistory);
    alert(`Prescription billing payment logged successfully! Medicines are now ready for dispensation.`);
  };

  // Sub-tabs state
  const [activeSubTab, setActiveSubTab] = useState<'pharma' | 'non-pharma'>('pharma');

  // Total pricing editable states
  const [pharmaTotalCost, setPharmaTotalCost] = useState<number | ''>('');
  const [nonPharmaTotalCost, setNonPharmaTotalCost] = useState<number | ''>('');

  // Unit price editable states
  const [pharmaPricePerUnit, setPharmaPricePerUnit] = useState<number | ''>('');
  const [nonPharmaPricePerUnit, setNonPharmaPricePerUnit] = useState<number | ''>('');

  // Daily auto-reset state for prescriptions
  const [showTodayOnly, setShowTodayOnly] = useState<boolean>(true);
  const [excludeArchived, setExcludeArchived] = useState<boolean>(true);

  // Automated/Manual Day Archiving States
  const [archivingStatus, setArchivingStatus] = useState<'idle' | 'archiving' | 'success' | 'error'>('idle');
  const [archivedCount, setArchivedCount] = useState<{ dispenses: number; prescriptions: number }>({ dispenses: 0, prescriptions: 0 });

  const handleUpdatePrescribedItemPrice = (patientId: string, recordId: string, itemIndex: number, newPrice: number) => {
    if (!onUpdatePatientHistory) return;
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const updatedHistory = (patient.medicalHistory || []).map(record => {
      if (record.id === recordId) {
        const updatedItems = (record.prescribedItems || []).map((item, idx) => {
          if (idx === itemIndex) {
            return { ...item, price: newPrice };
          }
          return item;
        });

        // Recompute the total invoice amount
        const computedInvoiceAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        return {
          ...record,
          prescribedItems: updatedItems,
          invoiceAmount: computedInvoiceAmount
        };
      }
      return record;
    });

    onUpdatePatientHistory(patientId, updatedHistory);
  };

  // Non-Pharmaceutical dispense states
  const [nonPharmaPatientId, setNonPharmaPatientId] = useState<string>('');
  const [selectedNonPharmaId, setSelectedNonPharmaId] = useState<string>('');
  const [nonPharmaQuantity, setNonPharmaQuantity] = useState<number>(1);

  // New stock item creation states
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<number>(50);
  const [newItemQty, setNewItemQty] = useState<number>(100);
  const [newItemCat, setNewItemCat] = useState<string>('Antibiotics');
  const [newItemThreshold, setNewItemThreshold] = useState<number>(15);

  // Bulk File Upload and Parsing States
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stock selection state for quick restock & threshold alerts
  const [restockStockId, setRestockStockId] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(0);
  const [thresholdVal, setThresholdVal] = useState<number>(15);

  // Filter views states
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dispenseSearchQuery, setDispenseSearchQuery] = useState<string>('');
  const [nonPharmaSearchQuery, setNonPharmaSearchQuery] = useState<string>('');
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  const [nonPharmaPatientSearchQuery, setNonPharmaPatientSearchQuery] = useState<string>('');

  // Period filter states for history ledger
  const [periodFilter, setPeriodFilter] = useState<'all' | 'weekly' | 'monthly' | 'quarterly' | 'search-month'>('all');
  const [searchMonthVal, setSearchMonthVal] = useState<string>('2026-05');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'pharma' | 'non-pharma'>('all');
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [selectedHistoryPatientId, setSelectedHistoryPatientId] = useState<string | null>(null);
  const [selectedHistoryPatientName, setSelectedHistoryPatientName] = useState<string | null>(null);

  React.useEffect(() => {
    setLedgerPage(1);
  }, [periodFilter, searchMonthVal, ledgerSearchQuery, ledgerTypeFilter]);

  React.useEffect(() => {
    if (restockStockId) {
      const selectedItem = stock.find((item) => item.id === restockStockId);
      if (selectedItem) {
        setThresholdVal(selectedItem.minThreshold ?? 15);
      }
    }
  }, [restockStockId]);

  const activeStockItem = stock.find((item) => item.id === selectedStockId);
  const activeNonPharmaItem = stock.find((item) => item.id === selectedNonPharmaId);

  React.useEffect(() => {
    if (activeStockItem) {
      setPharmaPricePerUnit(activeStockItem.price);
    } else {
      setPharmaPricePerUnit('');
    }
  }, [selectedStockId]);

  React.useEffect(() => {
    if (activeNonPharmaItem) {
      setNonPharmaPricePerUnit(activeNonPharmaItem.price);
    } else {
      setNonPharmaPricePerUnit('');
    }
  }, [selectedNonPharmaId]);

  const pharmaUnitPrice = pharmaPricePerUnit !== '' ? Number(pharmaPricePerUnit) : (activeStockItem?.price ?? 0);
  const computedTotalCost = activeStockItem ? pharmaUnitPrice * dispenseQuantity : 0;

  const nonPharmaUnitPrice = nonPharmaPricePerUnit !== '' ? Number(nonPharmaPricePerUnit) : (activeNonPharmaItem?.price ?? 0);
  const computedNonPharmaCost = activeNonPharmaItem ? nonPharmaUnitPrice * nonPharmaQuantity : 0;

  React.useEffect(() => {
    setPharmaTotalCost(computedTotalCost);
  }, [computedTotalCost]);

  React.useEffect(() => {
    setNonPharmaTotalCost(computedNonPharmaCost);
  }, [computedNonPharmaCost]);

  // Helper to identify non-pharmaceutical categories
  const isNonPharma = (category: string) => {
    return category === 'Non-Pharmaceutical' || category === 'Surgicals & Non-Pharmaceuticals';
  };

  // Filter items with search input and optional minimum threshold filter logic
  const pharmaItems = stock.filter((item) => {
    if (isNonPharma(item.category)) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const belowThreshold = item.stockQuantity <= (item.minThreshold ?? 15);
    return matchesSearch && (!showLowStockOnly || belowThreshold);
  });

  const nonPharmaItems = stock.filter((item) => {
    if (!isNonPharma(item.category)) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const belowThreshold = item.stockQuantity <= (item.minThreshold ?? 15);
    return matchesSearch && (!showLowStockOnly || belowThreshold);
  });

  // Dedicated filters for the dispensation dropdown menus
  const dropdownPharmaItems = stock.filter((item) => {
    if (isNonPharma(item.category)) return false;
    const matchesSearch = item.name.toLowerCase().includes(dispenseSearchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(dispenseSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const dropdownNonPharmaItems = stock.filter((item) => {
    if (!isNonPharma(item.category)) return false;
    const matchesSearch = item.name.toLowerCase().includes(nonPharmaSearchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(nonPharmaSearchQuery.toLowerCase());
    return matchesSearch;
  });

  // Compute Revenue over different intervals (Daily, Weekly, Monthly)
  const today = new Date();
  
  const getDaysDiff = (dateStr: string) => {
    const diffTime = Math.abs(today.getTime() - new Date(dateStr).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const todayStr = today.toISOString().split('T')[0];
  const [pharmaDispenseDate, setPharmaDispenseDate] = useState<string>(todayStr);
  const [nonPharmaDispenseDate, setNonPharmaDispenseDate] = useState<string>(todayStr);
  
  const dailyDispenses = dispenses.filter((d) => d.dispenseDate === todayStr);
  const dailyRev = dailyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const weeklyDispenses = dispenses.filter((d) => getDaysDiff(d.dispenseDate) <= 7);
  const weeklyRev = weeklyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const monthlyDispenses = dispenses.filter((d) => getDaysDiff(d.dispenseDate) <= 30);
  const monthlyRev = monthlyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const totalLowStockCount = stock.filter((item) => item.stockQuantity <= (item.minThreshold ?? 15)).length;
  const criticalOutOfStockCount = stock.filter((item) => item.stockQuantity === 0).length;

  // Background Cron-Like Daily Archiving & Reset Checker
  React.useEffect(() => {
    let active = true;
    const checkAndRunAutoArchive = async () => {
      try {
        const lastResetDate = await getSystemConfigLastReset();
        if (!active) return;

        // If today is a new day and can see past records that have not been archived, auto-archive them to keep desk clean.
        const pastUnarchivedDispenses = dispenses.filter(d => d.dispenseDate < todayStr && !d.isArchived);
        const pastUnarchivedPatients = patients.filter(p => {
          return (p.medicalHistory || []).some(record => 
            record.date < todayStr && 
            record.prescribedItems && 
            record.prescribedItems.length > 0 && 
            !record.isArchived
          );
        });

        if (pastUnarchivedDispenses.length > 0 || pastUnarchivedPatients.length > 0) {
          console.log("Automated Daily Cron Logic: Past unarchived records detected. Triggering automated rollover reset...");
          setArchivingStatus('archiving');

          const uniqueDates = Array.from(new Set([
            ...pastUnarchivedDispenses.map(d => d.dispenseDate),
            ...pastUnarchivedPatients.flatMap(p => (p.medicalHistory || [])
              .filter(record => record.date < todayStr && !record.isArchived)
              .map(record => record.date)
            )
          ])).sort();

          let totalDisp = 0;
          let totalRx = 0;

          for (const dStr of uniqueDates) {
            const dList = pastUnarchivedDispenses.filter(d => d.dispenseDate === dStr);
            const pList = pastUnarchivedPatients.filter(p => (p.medicalHistory || []).some(r => r.date === dStr));
            const result = await archiveDailyPharmacyData(dList, pList, dStr);
            totalDisp += result.countDispenses;
            totalRx += result.countPrescriptions;
          }

          if (active) {
            setArchivedCount({ dispenses: totalDisp, prescriptions: totalRx });
            setArchivingStatus('success');
            await saveSystemConfigLastReset(todayStr);
            
            // Log an audit trial if possible
            console.log(`Auto-archiver: rollover complete. Saved ${totalDisp} dispenses & ${totalRx} prescriptions.`);
          }
        } else {
          // If already clean, update config to todayStr so we don't scan needlessly
          if (lastResetDate !== todayStr && active) {
            await saveSystemConfigLastReset(todayStr);
          }
        }
      } catch (err) {
        console.warn("Automated auto-archiving background worker warning: ", err);
        if (active) setArchivingStatus('error');
      }
    };

    if (patients.length > 0) {
      checkAndRunAutoArchive();
    }

    return () => {
      active = false;
    };
  }, [patients, dispenses, todayStr]);

  const handleManualArchiveToday = async () => {
    if (!confirm("Are you sure you want to write-close and archive today's Pharmacy Active Desk?\n\nThis will instantly archive all today's prescriptions and medication dispenses, resetting the Pharmacy Active Desk for the next morning. Financial records will remain totally preserved and tabulated.")) {
      return;
    }

    try {
      setArchivingStatus('archiving');
      const todayDispenses = dispenses.filter(d => d.dispenseDate === todayStr && !d.isArchived);
      const todayPatients = patients.filter(p => {
        return (p.medicalHistory || []).some(record => 
          record.date === todayStr && 
          record.prescribedItems && 
          record.prescribedItems.length > 0 && 
          !record.isArchived
        );
      });

      const result = await archiveDailyPharmacyData(todayDispenses, todayPatients, todayStr);
      setArchivedCount({ dispenses: result.countDispenses, prescriptions: result.countPrescriptions });
      setArchivingStatus('success');
      await saveSystemConfigLastReset(todayStr);
      alert(`Pristine Rollover Successful!\n\nSuccessfully archived ${result.countDispenses} medication dispenses and ${result.countPrescriptions} physician prescriptions. Active Pharmacy desk is now reset for the next morning.`);
    } catch (err: any) {
      console.error("Manual rollover failed: ", err);
      setArchivingStatus('error');
      alert(`Archiving failed: ${err?.message || err}`);
    }
  };

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensePatientId || !selectedStockId) {
      alert('Please select both a registered patient and a cataloged medication.');
      return;
    }

    const patient = patients.find((p) => p.id === dispensePatientId);
    const item = stock.find((i) => i.id === selectedStockId);

    if (!patient || !item) return;

    if (item.stockQuantity < dispenseQuantity) {
      alert(`Critical stock warnings: Insufficient inventory count for ${item.name}. Current stock is only ${item.stockQuantity} units.`);
      return;
    }

    const newDispense: MedicationDispense = {
      id: `DSP-${Date.now()}`,
      medicationName: item.name,
      patientId: dispensePatientId,
      patientName: patient.name,
      dispenseDate: pharmaDispenseDate,
      dispensedBy: dispensingOfficer,
      quantity: dispenseQuantity,
      pricePerUnit: pharmaPricePerUnit !== '' ? Number(pharmaPricePerUnit) : item.price,
      totalCost: pharmaTotalCost !== '' ? Number(pharmaTotalCost) : computedTotalCost,
    };

    onDispenseMedication(newDispense);
    setDispensePatientId('');
    setSelectedStockId('');
    setDispenseQuantity(1);
    setPharmaTotalCost('');
    setPharmaPricePerUnit('');
    alert(`Medication dispensed safely. Dispatched ${dispenseQuantity} units of ${item.name} to patient ${patient.name}.`);
  };

  const handleNonPharmaDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonPharmaPatientId || !selectedNonPharmaId) {
      alert('Please select both a registered patient and a cataloged supplies product.');
      return;
    }

    const patient = patients.find((p) => p.id === nonPharmaPatientId);
    const item = stock.find((i) => i.id === selectedNonPharmaId);

    if (!patient || !item) return;

    if (item.stockQuantity < nonPharmaQuantity) {
      alert(`Critical stock warnings: Insufficient inventory count for ${item.name}. Current stock is only ${item.stockQuantity} units.`);
      return;
    }

    const newDispense: MedicationDispense = {
      id: `DSP-${Date.now()}`,
      medicationName: item.name,
      patientId: nonPharmaPatientId,
      patientName: patient.name,
      dispenseDate: nonPharmaDispenseDate,
      dispensedBy: dispensingOfficer,
      quantity: nonPharmaQuantity,
      pricePerUnit: nonPharmaPricePerUnit !== '' ? Number(nonPharmaPricePerUnit) : item.price,
      totalCost: nonPharmaTotalCost !== '' ? Number(nonPharmaTotalCost) : computedNonPharmaCost,
    };

    onDispenseMedication(newDispense);
    setNonPharmaPatientId('');
    setSelectedNonPharmaId('');
    setNonPharmaQuantity(1);
    setNonPharmaTotalCost('');
    setNonPharmaPricePerUnit('');
    alert(`Non-pharmaceutical supplies dispensed safely. Dispatched ${nonPharmaQuantity} units of ${item.name} to patient ${patient.name}.`);
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockStockId) return;

    if (restockQty > 0) {
      onRestockItem(restockStockId, restockQty);
    }
    if (onUpdateThreshold) {
      onUpdateThreshold(restockStockId, thresholdVal);
    }
    setRestockStockId('');
    setRestockQty(0);
    alert('Stock inventory replenishment and minimum warning threshold updated successfully.');
  };

  // Simple quotation-aware CSV parser
  const parseCSVData = (rawText: string): Record<string, string>[] => {
    const lines = rawText.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const results: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols: string[] = [];
      let insideQuote = false;
      let currentRaw = '';

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cols.push(currentRaw.trim().replace(/^["']|["']$/g, ''));
          currentRaw = '';
        } else {
          currentRaw += char;
        }
      }
      cols.push(currentRaw.trim().replace(/^["']|["']$/g, ''));

      if (cols.length >= headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = cols[index] || '';
        });
        results.push(row);
      }
    }
    return results;
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processStockFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processStockFileUpload(files[0]);
    }
  };

  const processStockFileUpload = async (file: File) => {
    setUploadFeedback(null);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      setIsParsing(true);
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const parsedRows = parseCSVData(rawText);

          if (parsedRows.length === 0) {
            setUploadFeedback({ success: false, message: 'Vacant or incorrectly formatted CSV.' });
            setIsParsing(false);
            return;
          }

          let addedCount = 0;
          parsedRows.forEach((row) => {
            const nameKey = Object.keys(row).find(k => k.includes('name') || k.includes('medication') || k.includes('product') || k.includes('item'));
            const priceKey = Object.keys(row).find(k => k.includes('price') || k.includes('cost') || k.includes('rate') || k.includes('ksh'));
            const qtyKey = Object.keys(row).find(k => k.includes('qty') || k.includes('quantity') || k.includes('stock') || k.includes('intake') || k.includes('amount'));
            const catKey = Object.keys(row).find(k => k.includes('category') || k.includes('type') || k.includes('class'));
            const threshKey = Object.keys(row).find(k => k.includes('threshold') || k.includes('min') || k.includes('warning'));

            const foundName = nameKey ? row[nameKey] : undefined;
            const foundPrice = priceKey ? parseFloat(row[priceKey].replace(/[^0-9.]/g, '')) : 50;
            const foundQty = qtyKey ? parseInt(row[qtyKey].replace(/[^0-9]/g, '')) : 100;
            const foundCat = catKey ? row[catKey] : undefined;
            const foundThresh = threshKey ? parseInt(row[threshKey].replace(/[^0-9]/g, '')) : 15;

            let finalCat = 'Antibiotics';
            if (foundCat && ['Antibiotics', 'Analgesics', 'Anti-malarials', 'Anti-histamines', 'Supplements', 'Non-Pharmaceutical'].includes(foundCat.trim())) {
              finalCat = foundCat.trim();
            } else {
              const lowerName = (foundName || '').toLowerCase();
              if (lowerName.includes('bandage') || lowerName.includes('syringe') || lowerName.includes('glove') || lowerName.includes('cotton') || lowerName.includes('needle') || lowerName.includes('swab') || lowerName.includes('tape') || lowerName.includes('infusion')) {
                finalCat = 'Non-Pharmaceutical';
              }
            }

            if (foundName && foundName.trim()) {
              const newItem: PharmacyItem = {
                id: finalCat === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
                name: foundName.trim(),
                price: isNaN(foundPrice) ? 50 : foundPrice,
                stockQuantity: isNaN(foundQty) ? 100 : foundQty,
                category: finalCat,
                minThreshold: isNaN(foundThresh) ? 15 : foundThresh,
              };

              onAddNewStockItem(newItem);
              addedCount++;
            }
          });

          setUploadFeedback({ 
            success: true, 
            message: `Extracted ${addedCount} products/supplies from CSV catalog successfully.` 
          });
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `CSV upload error: ${err.message}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file);

    } else if (file.name.endsWith('.pdf')) {
      setIsParsing(true);
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const base64Content = dataUrl.split(',')[1];

          const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64Content,
              mimeType: 'application/pdf',
              dataType: 'pharmacyStock'
            })
          });

          const result = await response.json();
          if (response.ok && result.success && Array.isArray(result.items)) {
            let addCount = 0;
            result.items.forEach((item: any) => {
              if (item.name) {
                const newItem: PharmacyItem = {
                  id: item.category === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
                  name: item.name,
                  price: Number(item.price) || 50,
                  stockQuantity: Number(item.stockQuantity) || 100,
                  category: item.category || 'Antibiotics',
                  minThreshold: Number(item.minThreshold) || 15,
                };
                onAddNewStockItem(newItem);
                addCount++;
              }
            });
            setUploadFeedback({ 
              success: true, 
              message: `AI scanned pricing sheets: cataloged ${addCount} inventory products successfully.` 
            });
          } else {
            setUploadFeedback({ 
              success: false, 
              message: result.message || 'AI scanning paused. Please configure GEMINI_API_KEY inside secrets, or use .csv files.' 
            });
          }
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `PDF parsing failed: ${err.message}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUploadFeedback({ success: false, message: 'Invalid file format. Select a .csv spreadsheet or a .pdf price sheet.' });
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0 || newItemQty < 0 || newItemThreshold < 0) return;

    const newItem: PharmacyItem = {
      id: newItemCat === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
      name: newItemName.trim(),
      price: newItemPrice,
      stockQuantity: newItemQty,
      category: newItemCat,
      minThreshold: newItemThreshold,
    };

    onAddNewStockItem(newItem);
    setNewItemName('');
    setNewItemPrice(50);
    setNewItemQty(100);
    setNewItemThreshold(15);
    alert(`Successfully registered new item: ${newItem.name} (Threshold: ${newItemThreshold} units)`);
  };

  // Helper to resolve whether a record is a pharmaceutical or non-pharmaceutical item
  const getDispenseType = (medName: string): 'pharma' | 'non-pharma' => {
    const matched = stock.find((s) => s.name.toLowerCase() === medName.toLowerCase());
    if (matched) {
      return isNonPharma(matched.category) ? 'non-pharma' : 'pharma';
    }
    const lower = medName.toLowerCase();
    const isSupply = lower.includes('needle') || 
                     lower.includes('syringe') || 
                     lower.includes('glove') || 
                     lower.includes('bandage') || 
                     lower.includes('wool') || 
                     lower.includes('spirit') || 
                     lower.includes('strips') || 
                     lower.includes('strip') || 
                     lower.includes('giving set') || 
                     lower.includes('admin set') || 
                     lower.includes('catheter') || 
                     lower.includes('gauze') || 
                     lower.includes('plaster') || 
                     lower.includes('surgical') || 
                     lower.includes('canula') || 
                     lower.includes('cannula');
    return isSupply ? 'non-pharma' : 'pharma';
  };

  // --- Periodic Ledger Calculations ---
  const filteredLedgerDispenses = dispenses.filter((d) => {
    // Apply period filter
    let inPeriod = true;
    const dispenseDateObj = new Date(d.dispenseDate);
    const timeDiff = today.getTime() - dispenseDateObj.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (periodFilter === 'weekly') {
      inPeriod = daysDiff >= 0 && daysDiff <= 7;
    } else if (periodFilter === 'monthly') {
      inPeriod = daysDiff >= 0 && daysDiff <= 30;
    } else if (periodFilter === 'quarterly') {
      inPeriod = daysDiff >= 0 && daysDiff <= 90;
    } else if (periodFilter === 'search-month') {
      inPeriod = d.dispenseDate.startsWith(searchMonthVal);
    }

    if (!inPeriod) return false;

    // Apply ledger type (Pharma vs Non-Pharma) filter
    if (ledgerTypeFilter !== 'all') {
      const type = getDispenseType(d.medicationName);
      if (type !== ledgerTypeFilter) return false;
    }

    // Apply ledger search query filter (Patient Name, Patient ID, Medication, Dispensed By)
    if (ledgerSearchQuery.trim()) {
      const q = ledgerSearchQuery.toLowerCase();
      const matchesPatientName = d.patientName && d.patientName.toLowerCase().includes(q);
      const matchesPatientId = d.patientId && d.patientId.toLowerCase().includes(q);
      const matchesMedName = d.medicationName && d.medicationName.toLowerCase().includes(q);
      const matchesBy = d.dispensedBy && d.dispensedBy.toLowerCase().includes(q);
      return matchesPatientName || matchesPatientId || matchesMedName || matchesBy;
    }

    return true;
  });

  const sortedLedgerDispenses = [...filteredLedgerDispenses].sort((a, b) => {
    return new Date(b.dispenseDate).getTime() - new Date(a.dispenseDate).getTime();
  });

  // Unique Patients count
  const uniquePatientsCount = new Set(filteredLedgerDispenses.map(d => d.patientId)).size;
  // Total Items Dispensed
  const totalQtyDispensed = filteredLedgerDispenses.reduce((sum, d) => sum + d.quantity, 0);
  // Total Period Revenue Cost
  const totalPeriodCost = filteredLedgerDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  // Pagination Parameters
  const itemsPerPage = 15;
  const totalLedgerItems = sortedLedgerDispenses.length;
  const totalPages = Math.max(1, Math.ceil(totalLedgerItems / itemsPerPage));
  const paginatedLedger = sortedLedgerDispenses.slice((ledgerPage - 1) * itemsPerPage, ledgerPage * itemsPerPage);
  // --- End Periodic Ledger Calculations ---

  const selectedPatientDispenses = selectedHistoryPatientId
    ? dispenses.filter((d) => d.patientId === selectedHistoryPatientId)
    : [];

  const handleDownloadPatientPDF = () => {
    if (!selectedHistoryPatientId) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Printer-friendly corporate branding & audit layout (ink-safe)
    doc.setDrawColor(15, 23, 42); // slate 900
    doc.setLineWidth(0.8);
    doc.line(14, 10, 196, 10); // top border line
    doc.line(14, 40, 196, 40); // bottom border line

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PCEA TUMUTUMU SATELLITE MEDICAL HEALTH CENTER', 14, 18);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('OUTPATIENT CLINICAL DISPENSATION HISTORICAL LEDGER', 14, 25);
    doc.text(`Patient ID: ${selectedHistoryPatientId} • Generated: ${new Date().toLocaleDateString()} • Official Hospital Audit Record`, 14, 31);

    // Decorative Accent Line (Indigo / Blue Accent)
    doc.setDrawColor(79, 70, 229); // indigo-600
    doc.setLineWidth(0.5);
    doc.line(14, 37, 196, 37);

    // Let's add Patient Profile details
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PATIENT DEMOGRAPHIC & CLINICAL PROFILE', 14, 48);

    const matchedPatient = patients.find(p => p.id === selectedHistoryPatientId);
    let patientDetailsY = 54;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    if (matchedPatient) {
      doc.text(`Full Name: ${selectedHistoryPatientName || 'N/A'}`, 14, patientDetailsY);
      doc.text(`OP Number: ${matchedPatient.opNumber || 'N/A'}`, 110, patientDetailsY);
      patientDetailsY += 5;
      doc.text(`Age / Gender: ${matchedPatient.age} ${matchedPatient.ageUnit || 'Years'} / ${matchedPatient.gender}`, 14, patientDetailsY);
      doc.text(`Phone Contact: ${matchedPatient.phone || 'N/A'}`, 110, patientDetailsY);
      patientDetailsY += 5;
      doc.text(`Patient Category: ${matchedPatient.category} ${matchedPatient.isWalkIn ? '(Walk-In)' : '(Registered)'}`, 14, patientDetailsY);
    } else {
      doc.text(`Full Name: ${selectedHistoryPatientName || 'N/A'}`, 14, patientDetailsY);
      doc.text(`OP Number: Walk-In Reference`, 110, patientDetailsY);
      patientDetailsY += 5;
      doc.text(`Age / Gender: Not Registered (Walk-In)`, 14, patientDetailsY);
      doc.text(`Status: Temporary Registration`, 110, patientDetailsY);
    }

    doc.setDrawColor(226, 232, 240); // border-stone-200
    doc.setLineWidth(0.3);
    doc.line(14, patientDetailsY + 3, 196, patientDetailsY + 3);

    let summaryY = patientDetailsY + 9;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('LEDGER DISPENSATION METRICS SUMMARY', 14, summaryY);

    const totalQty = selectedPatientDispenses.reduce((sum, d) => sum + d.quantity, 0);
    const totalCostVal = selectedPatientDispenses.reduce((sum, d) => sum + d.totalCost, 0);

    summaryY += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Dispensation Incidents: ${selectedPatientDispenses.length}`, 14, summaryY);
    doc.text(`Aggregate Units Supplied: ${totalQty} units`, 75, summaryY);
    doc.text(`Cumulative Financial Billing: Ksh ${totalCostVal.toLocaleString()}`, 135, summaryY);

    let tableY = summaryY + 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DETAILED DISPENSATION CHRONOLOGY', 14, tableY);

    const tblHeaders = [['Dispense ID', 'Date', 'Classification', 'Dispatched Medical Item', 'Qty', 'Unit Price', 'Total Cost', 'Dispensed By']];
    const tblRows = [...selectedPatientDispenses]
      .sort((a, b) => new Date(b.dispenseDate).getTime() - new Date(a.dispenseDate).getTime())
      .map(d => [
        d.id,
        d.dispenseDate,
        getDispenseType(d.medicationName) === 'non-pharma' ? 'Non-Pharma' : 'Medicine',
        d.medicationName,
        String(d.quantity),
        `Ksh ${d.pricePerUnit}`,
        `Ksh ${d.totalCost}`,
        d.dispensedBy
      ]);

    autoTable(doc, {
      head: tblHeaders,
      body: tblRows,
      startY: tableY + 3,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }, // indigo-600
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
      }
    });

    const patientSafeName = (selectedHistoryPatientName || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '_');
    doc.save(`clinical_ledger_${patientSafeName}_${selectedHistoryPatientId}.pdf`);
  };

  return (
    <div id="pharmacy-module" className="space-y-6">
      {/* Dynamic Revenue Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Daily Pharmacy Dispenses</span>
            <span className="text-xl font-bold text-stone-900">{dailyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {dailyRev.toLocaleString()} generated</span>
          </div>
          <ShoppingBag className="w-8 h-8 text-indigo-500" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Weekly Pharmacy Ledger</span>
            <span className="text-xl font-bold text-stone-900">{weeklyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {weeklyRev.toLocaleString()} generated</span>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Monthly Pharmacy Volume</span>
            <span className="text-xl font-bold text-stone-900">{monthlyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {monthlyRev.toLocaleString()} generated</span>
          </div>
          <CalendarDays className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Doctor Prescriptions Pending Dispensation Desk */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Doctors' Clinical Prescriptions & Dispensing Desk
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Real-time clinical prescription logs and itemized billing status</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-50 hover:bg-stone-100/90 p-1.5 px-3 border border-stone-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showTodayOnly}
                onChange={(e) => setShowTodayOnly(e.target.checked)}
                className="rounded-sm border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
              />
              <span className="text-[11px]">Today's Only</span>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold font-mono">Daily Reset</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-50 hover:bg-stone-100/90 p-1.5 px-3 border border-stone-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={excludeArchived}
                onChange={(e) => setExcludeArchived(e.target.checked)}
                className="rounded-sm border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
              />
              <span className="text-[11px]">Hide Archived Logs</span>
              <span className="bg-teal-100 text-teal-800 text-[9px] px-1.5 py-0.2 rounded font-bold font-mono">Clean Desk</span>
            </label>

            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-full border border-emerald-100 shrink-0">
              Real-time Sync Active
            </span>
          </div>
        </div>

        {/* End of Day Archiving & Financial Tabulation Center Panel */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  End-of-Day Financial Tabulation & Archiving Center
                </h4>
                <p className="text-[10px] text-stone-500 font-sans">Automated midnight background cron worker & on-demand manual desk resetters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {archivingStatus === 'archiving' && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" /> Archiving records...
                </span>
              )}
              {archivingStatus === 'success' && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  <Check className="w-3 h-3 text-emerald-600" /> Tabulated (Archived {archivedCount.dispenses} dispenses, {archivedCount.prescriptions} rx)
                </span>
              )}
              {archivingStatus === 'error' && (
                <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-medium">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Error saving archives
                </span>
              )}
              <span className="text-[10px] text-stone-400 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded font-mono">
                System Time Check: Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-stone-200">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Today's Revenue</span>
              <span className="text-xs font-mono font-bold text-stone-900 block mt-0.5">Ksh {dailyRev.toLocaleString()}</span>
              <span className="text-[8px] text-emerald-600 font-semibold mt-0.5 block">100% Tabulated</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Unarchived Today</span>
              <span className="text-xs font-mono font-bold text-stone-900 block mt-0.5">
                {dispenses.filter(d => d.dispenseDate === todayStr && !d.isArchived).length} Dispenses
              </span>
              <span className="text-[8px] text-stone-500 block mt-0.5 font-semibold">Ready for rollover</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Pending Active Rx</span>
              <span className="text-xs font-mono font-bold text-stone-900 block mt-0.5">
                {patients.flatMap(p => (p.medicalHistory || []).filter(r => r.date === todayStr && r.prescribedItems && r.prescribedItems.length > 0 && !r.isArchived)).length} Orders
              </span>
              <span className="text-[8px] text-stone-500 block mt-0.5">Active desk buffer</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex flex-col justify-center">
              <button
                id="btn-manual-archive"
                onClick={handleManualArchiveToday}
                disabled={archivingStatus === 'archiving'}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-stone-300 text-white text-[10px] py-1.5 px-2.5 rounded font-bold transition-all flex items-center justify-center gap-1 border border-black cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Archive Today's Desk
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-medium col-span-5">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Patient Details</th>
                <th className="py-2.5">Prescription & Diagnostic Info</th>
                <th className="py-2.5">Bill Amount</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {(() => {
                let rxList = patients.flatMap(p => {
                  return (p.medicalHistory || [])
                    .filter(record => record.prescribedItems && record.prescribedItems.length > 0)
                    .map(record => ({
                      patientId: p.id,
                      patientName: p.name,
                      opNumber: p.opNumber,
                      recordId: record.id,
                      date: record.date,
                      symptoms: record.symptoms,
                      diagnoses: record.diagnoses,
                      prescribedItems: record.prescribedItems || [],
                      billingStatus: record.billingStatus || 'Unpaid',
                      invoiceAmount: record.invoiceAmount || 0,
                      doctorName: record.doctorName,
                      paymentMode: p.paymentMode || 'Cash',
                      insuranceCompany: p.insuranceCompany,
                      isArchived: !!record.isArchived
                    }));
                }).sort((a, b) => b.date.localeCompare(a.date));

                if (showTodayOnly) {
                  rxList = rxList.filter(rx => rx.date === todayStr);
                }

                if (excludeArchived) {
                  rxList = rxList.filter(rx => !rx.isArchived);
                }

                if (rxList.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No physician prescriptions generated {showTodayOnly ? "today." : "inside database history."} {excludeArchived && "(Archived records are excluded)"}
                      </td>
                    </tr>
                  );
                }

                return rxList.map(rx => (
                  <tr id={`p-rx-tr-${rx.recordId}`} key={rx.recordId} className="hover:bg-stone-50/50">
                    <td className="py-3 font-mono text-[11px]">{rx.date}</td>
                    <td className="py-3">
                      <span className="font-bold text-stone-900 block">{rx.patientName}</span>
                      <span className="text-[10px] text-stone-400 font-mono block">OP-No: {rx.opNumber} • ID: {rx.patientId}</span>
                      <span className="text-[10px] text-stone-500 block mt-1">
                        Mode: <strong className="font-semibold text-stone-700">{rx.paymentMode}</strong>
                        {rx.paymentMode === 'Insurance' && ` (${rx.insuranceCompany})`}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="max-w-[420px] space-y-1.5">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Diagnosis:</span>
                          <p className="text-[11px] text-stone-800 leading-tight font-medium pb-1">{rx.diagnoses}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Medications & Pricing:</span>
                          <div className="space-y-1.5 mt-0.5">
                            {rx.prescribedItems.map((med: any, idx: number) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 p-1.5 px-2 border border-stone-100 rounded-md text-[11px] text-emerald-900 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span className="font-bold text-stone-800">{med.name}</span>
                                  <span className="text-stone-500 font-semibold">x{med.quantity}</span>
                                  {med.dosage && <span className="text-stone-400 font-sans text-[10px]">[{med.dosage}]</span>}
                                </div>
                                <div className="flex items-center gap-1 ml-0 sm:ml-auto">
                                  <span className="text-[10px] text-stone-400">Ksh</span>
                                  <input
                                    type="number"
                                    value={med.price}
                                    onChange={(e) => handleUpdatePrescribedItemPrice(rx.patientId, rx.recordId, idx, Number(e.target.value))}
                                    disabled={rx.billingStatus === 'Dispensed'}
                                    className="w-16 bg-white border border-stone-200 rounded p-0.5 px-1 font-bold text-center text-[10px] text-emerald-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                                    placeholder="Price"
                                  />
                                  <span className="text-stone-400 text-[10px] font-semibold font-sans">= Ksh {(med.price * med.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-stone-900 block">Ksh {rx.invoiceAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-stone-400 font-mono block">Dr. {rx.doctorName}</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {rx.billingStatus === 'Unpaid' ? (
                          <>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full shrink-0">
                              Awaiting Payment
                            </span>
                            <button
                              id={`btn-rx-pay-direct-${rx.recordId}`}
                              onClick={() => handlePayPrescriptionFromPharmacy(rx.patientId, rx.recordId)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1 px-2.5 rounded font-medium border border-emerald-500 cursor-pointer"
                            >
                              Collect Cash
                            </button>
                          </>
                        ) : rx.billingStatus === 'Paid' ? (
                          <>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              Ready To Dispense
                            </span>
                            <button
                              id={`btn-rx-dispense-${rx.recordId}`}
                              onClick={() => handleDispensePrescription(rx.patientId, rx.recordId)}
                              className="bg-stone-900 hover:bg-stone-800 text-white text-[10px] py-1 px-3 rounded font-bold border border-stone-950 cursor-pointer animate-pulse"
                            >
                              Dispense Rx Medicine
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full shrink-0">
                            Dispensed & Cleared
                          </span>
                        )}
                        {rx.isArchived && (
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full shrink-0">
                            Archived Log
                          </span>
                        )}
                        <button
                          id={`btn-pdf-rx-phm-${rx.recordId}`}
                          onClick={() => {
                            const doc = new jsPDF();
                            
                            doc.setFont("Helvetica", "bold");
                            doc.setFontSize(18);
                            doc.setTextColor(31, 41, 55);
                            doc.text("TUMUTUMU HOSPITAL", 14, 20);
                            
                            doc.setFont("Helvetica", "normal");
                            doc.setFontSize(9);
                            doc.setTextColor(107, 114, 128);
                            doc.text("P.O. Box 123, Nyeri County • Tel: +254 700 000 000", 14, 26);
                            doc.text(`Bill Ref: PHM-INV-${rx.recordId} • Date: ${rx.date}`, 14, 31);
                            
                            doc.setDrawColor(229, 231, 235);
                            doc.line(14, 36, 196, 36);
                            
                            doc.setFont("Helvetica", "bold");
                            doc.setFontSize(10);
                            doc.text("BILLING & RX RECEIPT DETAILS:", 14, 44);
                            
                            doc.setFont("Helvetica", "normal");
                            doc.setFontSize(9);
                            doc.text(`Patient Name: ${rx.patientName}`, 14, 50);
                            doc.text(`Reference ID: ${rx.patientId} • OP Number: ${rx.opNumber || 'N/A'}`, 14, 55);
                            doc.text(`Payment Mode: ${rx.paymentMode} ${rx.paymentMode === 'Insurance' ? `(${rx.insuranceCompany || 'N/A'})` : ''}`, 14, 60);
                            doc.text(`Prescribed By: Dr. ${rx.doctorName}`, 14, 65);
                            doc.text(`Invoiced Amount: Ksh ${rx.invoiceAmount.toLocaleString()} (${rx.billingStatus.toUpperCase()})`, 14, 70);
                            
                            const rows = rx.prescribedItems.map((item: any, idx: number) => [
                              idx + 1,
                              item.name,
                              item.quantity,
                              `Ksh ${item.price.toLocaleString()}`,
                              `Ksh ${(item.quantity * item.price).toLocaleString()}`
                            ]);
                            
                            autoTable(doc, {
                              startY: 76,
                              head: [['#', 'Medication Item', 'Qty', 'Unit Price', 'Total']],
                              body: rows,
                              theme: 'striped',
                              headStyles: { fillColor: [68, 64, 60] },
                              styles: { fontSize: 8 }
                            });
                            
                            const finalRowY = (doc as any).lastAutoTable.finalY + 12;
                            doc.setFont("Helvetica", "bold");
                            doc.text(`TOTAL CHARGED: Ksh ${rx.invoiceAmount.toLocaleString()}`, 14, finalRowY);
                            doc.text(`RECEIPT STATUS: ${rx.billingStatus === 'Unpaid' ? 'UNPAID / PENDING' : 'PAID & REGISTERED'}`, 14, finalRowY + 5);
                            
                            doc.setFont("Helvetica", "italic");
                            doc.text("Serving Nyeri County with dignity and care. Quick Recovery!", 14, finalRowY + 15);
                            
                            doc.save(`Rx_Invoice_${rx.patientName.replace(/\s+/g, '_')}_${rx.recordId}.pdf`);
                          }}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] px-2 py-1 rounded inline-flex items-center gap-1 border border-stone-300 cursor-pointer"
                        >
                          <Download className="w-2.5 h-2.5" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tab select control */}
      <div className="flex border-b border-stone-200">
        <button
          id="btn-subtab-pharma"
          type="button"
          onClick={() => setActiveSubTab('pharma')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold transition-all border-b-2 mr-4 ${
            activeSubTab === 'pharma'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-600" />
          Pharmaceutical Medications ({pharmaItems.length} items)
        </button>
        <button
          id="btn-subtab-nonpharma"
          type="button"
          onClick={() => setActiveSubTab('non-pharma')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold transition-all border-b-2 ${
            activeSubTab === 'non-pharma'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <PackageOpen className="w-4 h-4 text-indigo-600" />
          Non-Pharmaceutical Supplies ({nonPharmaItems.length} items)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispense Panel */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
          {activeSubTab === 'pharma' ? (
            <>
              <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Pill className="w-4.5 h-4.5 text-emerald-600" />
                Dispense Medication Form
              </h3>

              <form onSubmit={handleDispense} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label id="lbl-dispense-patient" className="block font-medium text-stone-500">Target Patient</label>
                    {!isRegisteringWalkIn && (
                      <button
                        type="button"
                        onClick={() => setIsRegisteringWalkIn(true)}
                        className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Pharmacy Walk-In
                      </button>
                    )}
                  </div>

                  {isRegisteringWalkIn ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-2.5 mb-2">
                      <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/50">
                        <span className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">New Pharmacy Walk-In Patient</span>
                        <button
                          type="button"
                          onClick={() => setIsRegisteringWalkIn(false)}
                          className="text-[10px] text-stone-500 hover:text-stone-800 font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g., Jane Doe"
                          value={walkInName}
                          onChange={(e) => setWalkInName(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-1">Age (Years)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            max={150}
                            value={walkInAge}
                            onChange={(e) => setWalkInAge(Number(e.target.value))}
                            className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-1">Gender</label>
                          <select
                            value={walkInGender}
                            onChange={(e) => setWalkInGender(e.target.value as any)}
                            className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden text-xs"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 mb-1">Phone Contact</label>
                        <input
                          type="text"
                          placeholder="E.g., 0712345678"
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateWalkIn}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Save & Select Walk-In
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search patient in list */}
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Type to filter patients instantly..."
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 pl-8 pr-8 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                        />
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                        {patientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPatientSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200/90 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <select
                        id="select-dispense-patient"
                        required
                        value={dispensePatientId}
                        onChange={(e) => setDispensePatientId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      >
                        {(() => {
                          const filtered = patients.filter((p) => {
                            const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                            const q = patientSearchQuery.toLowerCase();
                            return (
                              p.name.toLowerCase().includes(q) ||
                              p.id.toLowerCase().includes(q) ||
                              op.toLowerCase().includes(q) ||
                              (p.walkInTag && p.walkInTag.toLowerCase().includes(q))
                            );
                          });

                          return (
                            <>
                              <option value="">
                                {filtered.length === 0 
                                  ? '-- No patients matched search query --'
                                  : `-- Choose Patient (${filtered.length} matched) --`}
                              </option>
                              {filtered.map((p) => {
                                const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.walkInTag ? `[${p.walkInTag}]` : ''} ({p.id} | {op})
                                  </option>
                                );
                              })}
                            </>
                          );
                        })()}
                      </select>
                    </>
                  )}
                </div>

                <div>
                  <label id="lbl-dispense-med" className="block font-medium text-stone-500 mb-1">Medication Selection</label>
                  
                  {/* Search medications in list */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Type to filter medications instantly..."
                      value={dispenseSearchQuery}
                      onChange={(e) => setDispenseSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 pl-8 pr-8 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    {dispenseSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDispenseSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200/90 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    id="select-dispense-med"
                    required
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">
                      {dropdownPharmaItems.length === 0 
                        ? '-- No medications matched search query --' 
                        : `-- Choose Medicine (${dropdownPharmaItems.length} matched) --`}
                    </option>
                    {dropdownPharmaItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stockQuantity <= 0}>
                        {item.name} ({item.stockQuantity} Left) - Ksh {item.price}/unit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label id="lbl-pharma-unit-price" className="block font-medium text-stone-500 mb-1">Unit Price (Ksh)</label>
                    <input
                      id="inp-pharma-unit-price"
                      type="number"
                      required
                      min={0}
                      value={pharmaPricePerUnit}
                      onChange={(e) => setPharmaPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label id="lbl-dispense-qty" className="block font-medium text-stone-500 mb-1">Dispensation Qty</label>
                    <input
                      id="inp-dispense-qty"
                      type="number"
                      required
                      min={1}
                      max={activeStockItem ? activeStockItem.stockQuantity : 100}
                      value={dispenseQuantity}
                      onChange={(e) => setDispenseQuantity(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label id="lbl-pharma-total-cost" className="block font-medium text-stone-500 mb-1">Total Pricing (Ksh)</label>
                    <input
                      id="inp-pharma-total-cost"
                      type="number"
                      required
                      min={0}
                      value={pharmaTotalCost}
                      onChange={(e) => setPharmaTotalCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label id="lbl-pharma-dispense-date" className="block font-medium text-stone-500 mb-1">Dispended Date (Backdate Support)</label>
                  <input
                    id="inp-pharma-dispense-date"
                    type="date"
                    required
                    value={pharmaDispenseDate}
                    onChange={(e) => setPharmaDispenseDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label id="lbl-dispensing-officer" className="block font-medium text-stone-500 mb-1">Dispensed By (Whitelisted Pharmacist)</label>
                  <input
                    id="inp-dispensing-officer"
                    type="text"
                    required
                    value={dispensingOfficer}
                    onChange={(e) => setDispensingOfficer(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden text-stone-500"
                  />
                </div>

                <button
                  id="btn-dispense-med"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Complete Dispensation Dispatch
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <PackageOpen className="w-4.5 h-4.5 text-indigo-600" />
                Dispense Supply Form (Non-Pharma)
              </h3>

              <form onSubmit={handleNonPharmaDispense} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label id="lbl-dispense-nonpharma-patient" className="block font-medium text-stone-500">Target Patient</label>
                    {!isRegisteringWalkIn && (
                      <button
                        type="button"
                        onClick={() => setIsRegisteringWalkIn(true)}
                        className="text-indigo-700 hover:text-indigo-800 text-[10px] font-bold underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Pharmacy Walk-In
                      </button>
                    )}
                  </div>

                  {isRegisteringWalkIn ? (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg space-y-2.5 mb-2">
                      <div className="flex justify-between items-center pb-1.5 border-b border-indigo-200/50">
                        <span className="font-bold text-[10px] text-indigo-800 uppercase tracking-wider">New Pharmacy Walk-In Patient</span>
                        <button
                          type="button"
                          onClick={() => setIsRegisteringWalkIn(false)}
                          className="text-[10px] text-stone-500 hover:text-stone-800 font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g., Jane Doe"
                          value={walkInName}
                          onChange={(e) => setWalkInName(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-1">Age (Years)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            max={150}
                            value={walkInAge}
                            onChange={(e) => setWalkInAge(Number(e.target.value))}
                            className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-500 mb-1">Gender</label>
                          <select
                            value={walkInGender}
                            onChange={(e) => setWalkInGender(e.target.value as any)}
                            className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 mb-1">Phone Contact</label>
                        <input
                          type="text"
                          placeholder="E.g., 0712345678"
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-md p-1.5 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateWalkIn}
                        className="w-full bg-indigo-700 hover:bg-indigo-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Save & Select Walk-In
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search patient in list */}
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Type to filter patients instantly..."
                          value={nonPharmaPatientSearchQuery}
                          onChange={(e) => setNonPharmaPatientSearchQuery(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 pl-8 pr-8 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        />
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                        {nonPharmaPatientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setNonPharmaPatientSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200/90 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <select
                        id="select-dispense-nonpharma-patient"
                        required
                        value={nonPharmaPatientId}
                        onChange={(e) => setNonPharmaPatientId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      >
                        {(() => {
                          const filtered = patients.filter((p) => {
                            const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                            const q = nonPharmaPatientSearchQuery.toLowerCase();
                            return (
                              p.name.toLowerCase().includes(q) ||
                              p.id.toLowerCase().includes(q) ||
                              op.toLowerCase().includes(q) ||
                              (p.walkInTag && p.walkInTag.toLowerCase().includes(q))
                            );
                          });

                          return (
                            <>
                              <option value="">
                                {filtered.length === 0 
                                  ? '-- No patients matched search query --'
                                  : `-- Choose Patient (${filtered.length} matched) --`}
                              </option>
                              {filtered.map((p) => {
                                const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.walkInTag ? `[${p.walkInTag}]` : ''} ({p.id} | {op})
                                  </option>
                                );
                              })}
                            </>
                          );
                        })()}
                      </select>
                    </>
                  )}
                </div>

                <div>
                  <label id="lbl-dispense-nonpharma-item" className="block font-medium text-stone-500 mb-1">Supply Product Selection</label>
                  
                  {/* Search supplies in list */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Type to filter supplies instantly..."
                      value={nonPharmaSearchQuery}
                      onChange={(e) => setNonPharmaSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 pl-8 pr-8 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    {nonPharmaSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setNonPharmaSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200/90 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    id="select-dispense-nonpharma-item"
                    required
                    value={selectedNonPharmaId}
                    onChange={(e) => setSelectedNonPharmaId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">
                      {dropdownNonPharmaItems.length === 0 
                        ? '-- No supplies matched search query --' 
                        : `-- Choose Supplies Product (${dropdownNonPharmaItems.length} matched) --`}
                    </option>
                    {dropdownNonPharmaItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stockQuantity <= 0}>
                        {item.name} ({item.stockQuantity} Left) - Ksh {item.price}/unit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label id="lbl-nonpharma-unit-price" className="block font-medium text-stone-500 mb-1">Unit Price (Ksh)</label>
                    <input
                      id="inp-nonpharma-unit-price"
                      type="number"
                      required
                      min={0}
                      value={nonPharmaPricePerUnit}
                      onChange={(e) => setNonPharmaPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label id="lbl-dispense-nonpharma-qty" className="block font-medium text-stone-500 mb-1">Dispensation Qty</label>
                    <input
                      id="inp-dispense-nonpharma-qty"
                      type="number"
                      required
                      min={1}
                      max={activeNonPharmaItem ? activeNonPharmaItem.stockQuantity : 100}
                      value={nonPharmaQuantity}
                      onChange={(e) => setNonPharmaQuantity(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label id="lbl-nonpharma-total-cost" className="block font-medium text-stone-500 mb-1">Total Pricing (Ksh)</label>
                    <input
                      id="inp-nonpharma-total-cost"
                      type="number"
                      required
                      min={0}
                      value={nonPharmaTotalCost}
                      onChange={(e) => setNonPharmaTotalCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-bold text-indigo-800 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label id="lbl-nonpharma-dispense-date" className="block font-medium text-stone-500 mb-1">Dispended Date (Backdate Support)</label>
                  <input
                    id="inp-nonpharma-dispense-date"
                    type="date"
                    required
                    value={nonPharmaDispenseDate}
                    onChange={(e) => setNonPharmaDispenseDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label id="lbl-dispense-nonpharma-officer" className="block font-medium text-stone-500 mb-1">Dispensed By (Whitelisted Officer)</label>
                  <input
                    id="inp-dispense-nonpharma-officer"
                    type="text"
                    required
                    value={dispensingOfficer}
                    onChange={(e) => setDispensingOfficer(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden text-stone-500"
                  />
                </div>

                <button
                  id="btn-dispense-nonpharma"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Complete Supply Dispatch
                </button>
              </form>
            </>
          )}
        </div>

        {/* Catalog & Inventory Lists */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <PackageOpen className="w-4.5 h-4.5 text-emerald-600" />
              PCEA Tumutumu Karatina - {activeSubTab === 'pharma' ? 'Pharmaceutical Stock Formulas' : 'Non-Pharmaceutical supplies'}
            </h3>

            {/* Visual Stock Alert Center Banner */}
            {totalLowStockCount > 0 && (
              <div id="stock-warning-banner" className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3 text-xs leading-relaxed text-amber-900 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 font-sans">
                  <span className="font-bold text-amber-950 uppercase tracking-wider block mb-1">
                    Attention Required: Low Stock Warning ({totalLowStockCount} items affected)
                  </span>
                  <div className="text-stone-700">
                    There are currently <strong className="text-amber-900">{totalLowStockCount}</strong> inventory items near or below their custom critical minimum thresholds.
                    {criticalOutOfStockCount > 0 && (
                      <span> Of these, <strong className="text-rose-700">{criticalOutOfStockCount}</strong> are completely depleted.</span>
                    )}
                    {" "}Immediate replenishment action is recommended to guarantee clinical continuity.
                  </div>
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs font-sans">
              <div className="relative flex-1">
                <input
                  id="inp-inventory-search"
                  type="text"
                  placeholder="Search catalog by name or item reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-3 pr-8 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 transition cursor-pointer font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                id="btn-toggle-low-stock-filter"
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`py-2 px-4 rounded-lg font-semibold border flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                  showLowStockOnly
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {showLowStockOnly ? 'Showing Low Stock Only' : 'Show All Stock Items'}
                {totalLowStockCount > 0 && (
                  <span className={`inline-block ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${showLowStockOnly ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {totalLowStockCount}
                  </span>
                )}
              </button>
            </div>

            <div className="overflow-y-auto max-h-[300px] border border-stone-100 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-50 text-stone-500 font-medium sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Ref ID</th>
                    <th className="p-2.5">Item / Product Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Min Threshold</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Stock Status</th>
                    <th className="p-2.5 text-right font-semibold text-slate-800">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {(activeSubTab === 'pharma' ? pharmaItems : nonPharmaItems).map((item) => {
                    const thresh = item.minThreshold ?? 15;
                    const isLowStock = item.stockQuantity <= thresh;
                    const isOutOfStock = item.stockQuantity === 0;

                    let rowClass = "hover:bg-stone-50/50 transition-colors";
                    if (isOutOfStock) {
                      rowClass = "bg-rose-50/60 text-stone-900 border-l-4 border-l-rose-500 hover:bg-rose-100/60 transition-colors";
                    } else if (isLowStock) {
                      rowClass = "bg-amber-50/70 text-stone-900 border-l-4 border-l-amber-500 hover:bg-amber-100/70 transition-colors";
                    }

                    return (
                      <tr id={`rx-row-${item.id}`} key={item.id} className={rowClass}>
                        <td className="p-2.5 font-mono text-stone-500">{item.id}</td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            {item.name}
                            {isOutOfStock && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Depleted</span>}
                          </span>
                        </td>
                        <td className="p-2.5">{item.category}</td>
                        <td className="p-2.5 font-mono text-stone-600">{thresh} units</td>
                        <td className="p-2.5">Ksh {item.price}</td>
                        <td className="p-2.5">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" /> 0 units
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> {item.stockQuantity} units
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Pill className="w-3 h-3 text-emerald-600" /> {item.stockQuantity} units
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            id={`btn-row-restock-${item.id}`}
                            type="button"
                            onClick={() => {
                              onRestockItem(item.id, 50);
                              alert(`Successfully replenished +50 units of ${item.name}.`);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-900 text-[10px] px-2 py-0.5 rounded transition cursor-pointer font-bold"
                            title="Quick replenish +50 units"
                          >
                            +50
                          </button>
                          <button
                            id={`btn-row-configure-${item.id}`}
                            type="button"
                            onClick={() => {
                              setRestockStockId(item.id);
                              const selectEl = document.getElementById("select-restock-med");
                              if (selectEl) {
                                selectEl.focus();
                                selectEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded transition cursor-pointer font-medium"
                            title="Customize Warning Threshold & Restock Level"
                          >
                            Config
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(activeSubTab === 'pharma' ? pharmaItems : nonPharmaItems).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-stone-400 font-medium">
                        No products match selected filters in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
            {/* Bulk Catalog Scanner Dropzone */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200">
              <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                Bulk Stock Catalog Loader
              </h4>
              <p className="text-[10px] text-stone-500 mb-3">
                Quickly add dynamic medications, prices & consumable medical supplies in high volume using <strong>.csv spreadsheets</strong> or official <strong>PDF catalogs</strong>.
              </p>

              <div
                id="dropzone-pharmacy"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/40' 
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  id="input-file-pharmacy"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .pdf"
                  className="hidden"
                />
                {isParsing ? (
                  <div className="animate-pulse space-y-1">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                    <div className="text-[10px] font-semibold text-emerald-800">Processing stock list sheets...</div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-[11px] font-medium text-stone-600 mt-1">
                      Drag files or <span className="text-emerald-600 underline text-xs font-bold">browse</span>
                    </div>
                    <p className="text-[9px] text-stone-400 mt-0.5">Supports CSV / PDF directories</p>
                  </>
                )}
              </div>

              {uploadFeedback && (
                <div className={`mt-2.5 p-2 rounded text-[10px] font-medium flex items-center gap-1 border ${
                  uploadFeedback.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                    : 'bg-red-50 text-red-800 border-red-100'
                }`}>
                  {uploadFeedback.success ? <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Quick Restock Form */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200">
              <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                Quick Inventory & Threshold Restock
              </h4>
              <form onSubmit={handleRestock} className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Select Catalog Item</label>
                  <select
                    id="select-restock-med"
                    required
                    value={restockStockId}
                    onChange={(e) => setRestockStockId(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {stock.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.category}] {item.name} ({item.stockQuantity} Left, Threshold: {item.minThreshold ?? 15})
                      </option>
                    ))}
                  </select>
                </div>

                {restockStockId && (
                  <div className="bg-white border border-stone-150 rounded p-2 text-[10px] leading-relaxed text-stone-600">
                    {(() => {
                      const selItem = stock.find(i => i.id === restockStockId);
                      if (!selItem) return null;
                      const th = selItem.minThreshold ?? 15;
                      const isLow = selItem.stockQuantity <= th;
                      return (
                        <div>
                          <span className="font-bold text-stone-800 block mb-0.5">{selItem.name}</span>
                          Status: <strong className={selItem.stockQuantity === 0 ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}>
                            {selItem.stockQuantity} units in stock
                          </strong> (System warn threshold: {th} units)
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Replenish Qty</label>
                    <input
                      id="inp-restock-qty"
                      type="number"
                      required
                      min={0}
                      placeholder="Add stock qty"
                      value={restockQty}
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Alert Threshold</label>
                    <input
                      id="inp-restock-threshold"
                      type="number"
                      required
                      min={0}
                      placeholder="Warning threshold"
                      value={thresholdVal}
                      onChange={(e) => setThresholdVal(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-restock-submit"
                  type="submit"
                  className="w-full bg-stone-800 hover:bg-stone-900 border border-stone-700 text-white font-medium text-xs py-2 rounded transition-all cursor-pointer"
                >
                  Save Stock & Threshold Updates
                </button>
              </form>
            </div>

            {/* Catalog Brand New Item Form */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200 font-sans">
              <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-stone-600" />
                Register New Catalog Product
              </h4>
              <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Product Name</label>
                  <input
                    id="inp-new-med-name"
                    type="text"
                    required
                    placeholder="e.g. Crepe Bandages or Paracetamol"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Ksh Price</label>
                    <input
                      id="inp-new-med-price"
                      type="number"
                      required
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Intake Qty</label>
                    <input
                      id="inp-new-med-qty"
                      type="number"
                      required
                      placeholder="Stock quantity"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-405 uppercase mb-1">Stock Category</label>
                    <select
                      id="select-new-med-cat"
                      value={newItemCat}
                      onChange={(e) => setNewItemCat(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 text-xs text-[11px]"
                    >
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Anti-malarials">Anti-malarials</option>
                      <option value="Anti-histamines font-sans">Anti-histamines</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Non-Pharmaceutical">Non-Pharma Supply</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Alert Threshold</label>
                    <input
                      id="inp-new-med-threshold"
                      type="number"
                      required
                      min={0}
                      placeholder="Min warning qty"
                      value={newItemThreshold}
                      onChange={(e) => setNewItemThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
                <button
                  id="btn-add-new-med"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded transition-all cursor-pointer font-sans"
                >
                  Create & Catalog Product
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Dispensation History & Patient Period Ledger Section */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Patient Dispensation & Supply/Medication Ledger
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Filter by period or calendar month to view patients served, medications, and non-pharmaceutical formulas dispensed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Range Select Controls */}
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 text-xs">
              <button
                type="button"
                id="btn-ledger-filter-all"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  periodFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                id="btn-ledger-filter-weekly"
                onClick={() => setPeriodFilter('weekly')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  periodFilter === 'weekly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Weekly (7d)
              </button>
              <button
                type="button"
                id="btn-ledger-filter-monthly"
                onClick={() => setPeriodFilter('monthly')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  periodFilter === 'monthly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Monthly (30d)
              </button>
              <button
                type="button"
                id="btn-ledger-filter-quarterly"
                onClick={() => setPeriodFilter('quarterly')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  periodFilter === 'quarterly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Quarterly (90d)
              </button>
              <button
                type="button"
                id="btn-ledger-filter-search"
                onClick={() => setPeriodFilter('search-month')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  periodFilter === 'search-month'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Search Month
              </button>
            </div>

            {/* Custom Month Picker */}
            {periodFilter === 'search-month' && (
              <input
                type="month"
                id="inp-ledger-search-month"
                value={searchMonthVal}
                onChange={(e) => setSearchMonthVal(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden text-stone-700 w-36"
              />
            )}

            {/* Item Category Toggle Segment */}
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100 text-xs shadow-xs">
              <button
                type="button"
                id="btn-ledger-type-all"
                onClick={() => setLedgerTypeFilter('all')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  ledgerTypeFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                id="btn-ledger-type-pharma"
                onClick={() => setLedgerTypeFilter('pharma')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  ledgerTypeFilter === 'pharma'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Medicines (Pharma)
              </button>
              <button
                type="button"
                id="btn-ledger-type-nonpharma"
                onClick={() => setLedgerTypeFilter('non-pharma')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  ledgerTypeFilter === 'non-pharma'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Supplies (Non-Pharma)
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metrics Bar for active period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-250 text-xs">
          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-stone-200 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Patients Served (Period)</span>
            <span className="text-lg font-bold text-stone-900 mt-0.5 block">{uniquePatientsCount} patients</span>
          </div>
          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-stone-200 pb-3 sm:pb-0 sm:px-4">
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Medications & Supplies Dispatched</span>
            <span className="text-lg font-bold text-stone-900 mt-0.5 block">{totalQtyDispensed} units</span>
          </div>
          <div className="text-center sm:text-left sm:pl-4">
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Financial Transaction Volume</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">Ksh {totalPeriodCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Ledger Table Filter Search Bar */}
        <div className="relative">
          <input
            id="inp-ledger-search-query"
            type="text"
            placeholder="Search ledger by Patient Name, ID, Medication, or Officer..."
            value={ledgerSearchQuery}
            onChange={(e) => setLedgerSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-8 focus:ring-1 focus:ring-indigo-500 outline-hidden text-xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          {ledgerSearchQuery && (
            <button
              onClick={() => setLedgerSearchQuery('')}
              className="absolute right-3 top-2 text-stone-400 hover:text-stone-600 transition text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Ledger Data Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="p-3">Dispense ID</th>
                <th className="p-3">Patient Info</th>
                <th className="p-3">Item Type</th>
                <th className="p-3">Dispatched Item</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right font-semibold text-stone-900">Total Cost</th>
                <th className="p-3">Dispense Date</th>
                <th className="p-3">Dispensed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {paginatedLedger.map((d) => {
                const itemType = getDispenseType(d.medicationName);
                return (
                  <tr key={d.id} className="hover:bg-stone-50/40 transition">
                    <td className="p-3 font-mono text-[10px] text-stone-400">{d.id}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        id={`btn-ledger-patient-${d.patientId}`}
                        onClick={() => {
                          setSelectedHistoryPatientId(d.patientId);
                          setSelectedHistoryPatientName(d.patientName);
                        }}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline text-left cursor-pointer transition focus:outline-hidden"
                      >
                        {d.patientName}
                      </button>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">{d.patientId}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {itemType === 'non-pharma' ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          📦 Non-Pharma
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          💊 Medicine
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-stone-900">{d.medicationName}</td>
                    <td className="p-3 text-right font-semibold font-mono">{d.quantity}</td>
                    <td className="p-3 text-right text-stone-500 font-mono">Ksh {d.pricePerUnit}</td>
                    <td className="p-3 text-right font-bold text-stone-900 font-mono">Ksh {d.totalCost}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-semibold font-mono">
                        {d.dispenseDate}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600 font-medium">{d.dispensedBy}</td>
                  </tr>
                );
              })}

              {totalLedgerItems === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400 font-medium">
                    No dispensation logs matched selected filters for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalLedgerItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs">
            <span className="text-stone-500 font-sans">
              Showing <strong className="text-stone-800">{(ledgerPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-stone-800">
                {Math.min(ledgerPage * itemsPerPage, totalLedgerItems)}
              </strong>{" "}
              of <strong className="text-stone-800">{totalLedgerItems}</strong> logged entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={ledgerPage === 1}
                onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 font-semibold bg-white text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1 font-mono text-stone-500">
                <span className="px-2 py-1 bg-stone-100 rounded text-stone-800 font-bold">{ledgerPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={ledgerPage === totalPages}
                onClick={() => setLedgerPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 font-semibold bg-white text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Medication History Modal overlay */}
      {selectedHistoryPatientId && (
        <div id="patient-history-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-200 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in duration-250">
            {/* Header */}
            <div className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-indigo-100" />
                <div>
                  <h3 className="font-bold text-sm">Patient Clinical Dispensation Record</h3>
                  <p className="text-[11px] text-indigo-100/90 mt-0.5">
                    Historical ledger of administered medicines and supplies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-patient-history"
                onClick={() => {
                  setSelectedHistoryPatientId(null);
                  setSelectedHistoryPatientName(null);
                }}
                className="hover:bg-indigo-800 p-1.5 rounded-lg transition-all text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs leading-relaxed flex-1">
              {/* Patient Basic Card & Metrics Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="border-b border-stone-200 pb-2">
                    <span className="text-[10px] font-semibold text-indigo-700 uppercase font-mono tracking-wider">Clinical Profile</span>
                    <h4 className="text-sm font-bold text-stone-900 mt-1">
                      {selectedHistoryPatientName || 'Unnamed Patient'}
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400 block mt-0.5">ID: {selectedHistoryPatientId}</span>
                  </div>

                  {(() => {
                    const matchedPatient = patients.find(p => p.id === selectedHistoryPatientId);
                    if (matchedPatient) {
                      return (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-stone-600">
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase font-mono tracking-wider">OP Number</span>
                            <span className="font-semibold text-stone-800">{matchedPatient.opNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase font-mono tracking-wider">Gender</span>
                            <span className="font-semibold text-stone-800">{matchedPatient.gender}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase font-mono tracking-wider">Age</span>
                            <span className="font-semibold text-stone-800">{matchedPatient.age} {matchedPatient.ageUnit || 'Years'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase font-mono tracking-wider">Phone</span>
                            <span className="font-semibold text-stone-800">{matchedPatient.phone || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-stone-400 block uppercase font-mono tracking-wider">Type</span>
                            <span className="inline-flex text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-0.5">
                              {matchedPatient.category} {matchedPatient.isWalkIn ? '(Walk-In)' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-1 py-1 text-stone-500">
                          <p>No formal electronic registry card exists for this patient ID. Dispensed as an external cardholder or pharmacy walk-in.</p>
                          <span className="inline-flex text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 mt-2">
                            Walk-In Reference
                          </span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Metrics block */}
                <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">Dispensation Events</span>
                      <span className="text-2xl font-black text-indigo-900 mt-1 block">
                        {selectedPatientDispenses.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-500 font-medium font-sans block">Total encounters logged</span>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-widest block">Total Items Supplied</span>
                      <span className="text-2xl font-black text-emerald-900 mt-1 block">
                        {selectedPatientDispenses.reduce((sum, d) => sum + d.quantity, 0)}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium font-sans block">Aggregate dosage packs</span>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest block">Cumulative Billing</span>
                      <span className="text-xl font-bold font-mono text-amber-950 mt-1 block">
                        Ksh {selectedPatientDispenses.reduce((sum, d) => sum + d.totalCost, 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-600 font-medium font-sans block font-semibold">Gross outpatient billing value</span>
                  </div>
                </div>
              </div>

              {/* Detailed dispensations log table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Pill className="w-4 h-4 text-indigo-600" />
                  Chronological Itemized Ledger
                </h4>
                
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200 text-[11px]">
                      <tr>
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Date Dispensed</th>
                        <th className="p-3">Classification</th>
                        <th className="p-3">Dispatched Medical Item</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right font-semibold text-stone-900">Total Billed</th>
                        <th className="p-3">Dispatched By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700 text-xs">
                      {[...selectedPatientDispenses]
                        .sort((a, b) => new Date(b.dispenseDate).getTime() - new Date(a.dispenseDate).getTime())
                        .map((d) => {
                          const itemType = getDispenseType(d.medicationName);
                          return (
                            <tr key={d.id} className="hover:bg-stone-50/20 transition">
                              <td className="p-3 font-mono text-[10px] text-stone-400">{d.id}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono">
                                  {d.dispenseDate}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {itemType === 'non-pharma' ? (
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    📦 Non-Pharma
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    💊 Medicine
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-medium text-stone-900">{d.medicationName}</td>
                              <td className="p-3 text-right font-semibold font-mono">{d.quantity}</td>
                              <td className="p-3 text-right text-stone-500 font-mono">Ksh {d.pricePerUnit}</td>
                              <td className="p-3 text-right font-bold text-stone-900 font-mono">Ksh {d.totalCost}</td>
                              <td className="p-3 text-stone-600 font-medium">{d.dispensedBy}</td>
                            </tr>
                          );
                        })}

                      {selectedPatientDispenses.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-stone-400 font-medium">
                            No discrete medication or supply logs registered for this patient ID.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-download-patient-history-pdf"
                onClick={handleDownloadPatientPDF}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition cursor-pointer "
              >
                <Download className="w-4 h-4" />
                Save to PDF
              </button>
              <button
                type="button"
                id="btn-dismiss-patient-history"
                onClick={() => {
                  setSelectedHistoryPatientId(null);
                  setSelectedHistoryPatientName(null);
                }}
                className="px-5 py-2 rounded-lg border border-stone-250 font-bold bg-white text-stone-700 hover:bg-stone-100 text-xs transition cursor-pointer"
              >
                Dismiss Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
