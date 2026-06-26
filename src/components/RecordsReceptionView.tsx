/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Stethoscope, FileText, Calendar, DollarSign, History, ShieldAlert, Download, Heart } from 'lucide-react';
import { Patient, MedicalRecord, Appointment, UserRole, PharmacyItem, LabTest, LabCatalogItem } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordsReceptionViewProps {
  patients: Patient[];
  appointments: Appointment[];
  userRole: UserRole;
  userEmail: string;
  userName: string;
  onAddPatient: (patient: Patient) => void;
  onAddMedicalRecord: (patientId: string, record: MedicalRecord) => void;
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointmentBilling: (apptId: string, status: 'Paid' | 'Unpaid') => void;
  stock?: PharmacyItem[];
  onUpdatePatientHistory?: (patientId: string, history: MedicalRecord[]) => void;
  labTests?: LabTest[];
  labCatalog?: LabCatalogItem[];
  onAddLabTest?: (test: LabTest) => void;
  onUpdateLabTest?: (test: LabTest) => void;
}

export function RecordsReceptionView({
  patients,
  appointments,
  userRole,
  userEmail,
  userName,
  onAddPatient,
  onAddMedicalRecord,
  onAddAppointment,
  onUpdateAppointmentBilling,
  stock = [],
  onUpdatePatientHistory,
  labTests = [],
  labCatalog = [],
  onAddLabTest,
  onUpdateLabTest,
}: RecordsReceptionViewProps) {
  // Tabs: Register Patient, Manage Records, Appointments & Billing, View Patient Card
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'history' | 'appointments' | 'card'>('register');
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');
  const [selectedCardPatient, setSelectedCardPatient] = useState<Patient | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ehrSearchQuery, setEhrSearchQuery] = useState<string>('');
  const [apptSearchQuery, setApptSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [curSelectedPatient, setCurSelectedPatient] = useState<Patient | null>(null);

  // New Patient Form State
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<number>(30);
  const [newAgeUnit, setNewAgeUnit] = useState<'Years' | 'Months'>('Years');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'General Consultation' | 'Consultant Clinic' | 'Walk-in Lab' | 'Walk-in Pharmacy' | 'Outpatient Procedure'>('General Consultation');
  const [customProcedureAmount, setCustomProcedureAmount] = useState<number>(300);
  const [newSubCategory, setNewSubCategory] = useState<'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn'>('Surgical');
  const [customRegDate, setCustomRegDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newOpNumber, setNewOpNumber] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'Cash' | 'Insurance'>('Cash');
  const [newInsuranceCompany, setNewInsuranceCompany] = useState<string>('');
  const [insuranceConsultationPrice, setInsuranceConsultationPrice] = useState<number>(300);
  const [isWalkIn, setIsWalkIn] = useState<boolean>(false);
  const [walkInTag, setWalkInTag] = useState<'Lab Walk-In' | 'Pharmacy Walk-In' | 'Outpatient Procedure Walk-In' | undefined>(undefined);

  // Auto-generate OP Number when customRegDate changes
  useEffect(() => {
    const yearMonth = customRegDate ? customRegDate.substring(0, 7) : '2026-06';
    const rand = Math.floor(Math.random() * 9000 + 1000);
    setNewOpNumber(`OP-${yearMonth}-${rand}`);
  }, [customRegDate]);

  // Handle walk-in checkbox toggle
  const handleWalkInToggle = (checked: boolean) => {
    setIsWalkIn(checked);
    if (checked) {
      if (newCategory === 'General Consultation' || newCategory === 'Consultant Clinic') {
        setNewCategory('Walk-in Lab');
        setCustomProcedureAmount(100);
        setWalkInTag('Lab Walk-In');
      }
    } else {
      if (['Walk-in Lab', 'Walk-in Pharmacy', 'Outpatient Procedure'].includes(newCategory)) {
        setNewCategory('General Consultation');
        setCustomProcedureAmount(300);
        setWalkInTag(undefined);
      }
    }
  };

  // Auto-set default billing fee based on category
  useEffect(() => {
    switch (newCategory) {
      case 'General Consultation':
        setCustomProcedureAmount(300);
        setInsuranceConsultationPrice(300);
        setIsWalkIn(false);
        setWalkInTag(undefined);
        break;
      case 'Consultant Clinic':
        setCustomProcedureAmount(1500);
        setInsuranceConsultationPrice(1500);
        setIsWalkIn(false);
        setWalkInTag(undefined);
        break;
      case 'Walk-in Lab':
        setCustomProcedureAmount(100);
        setInsuranceConsultationPrice(100);
        setIsWalkIn(true);
        setWalkInTag('Lab Walk-In');
        break;
      case 'Walk-in Pharmacy':
        setCustomProcedureAmount(100);
        setInsuranceConsultationPrice(100);
        setIsWalkIn(true);
        setWalkInTag('Pharmacy Walk-In');
        break;
      case 'Outpatient Procedure':
        setCustomProcedureAmount(500);
        setInsuranceConsultationPrice(500);
        setIsWalkIn(true);
        setWalkInTag('Outpatient Procedure Walk-In');
        break;
      default:
        break;
    }
  }, [newCategory]);

  // New Medical Record Form State (for Doctors / Admins)
  const [symptoms, setSymptoms] = useState<string>('');
  const [diagnoses, setDiagnoses] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<string>('');

  // Structured Medications Prescription Builder States
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('');
  const [prescribeQty, setPrescribeQty] = useState<string | number>(1);
  const [prescribeDosage, setPrescribeDosage] = useState<string>('');
  const [activePrescriptionsList, setActivePrescriptionsList] = useState<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    dosage?: string;
  }[]>([]);

  const handleAddDrugToPrescription = () => {
    if (!selectedMedicationId) {
      alert("Please select a medication from the available stock list!");
      return;
    }
    const medication = stock.find(item => item.id === selectedMedicationId);
    if (!medication) {
      alert("Selected medication not found in stock inventory!");
      return;
    }

    const qty = Number(prescribeQty) || 1;
    if (qty <= 0) {
      alert("Please enter a valid quantity of 1 unit or more!");
      return;
    }

    if (medication.stockQuantity < qty) {
      alert(`Warning: Requested quantity (${qty}) exceeds currently available stock (${medication.stockQuantity} units).`);
    }

    const newItem = {
      itemId: medication.id,
      name: medication.name,
      quantity: qty,
      price: medication.price,
      dosage: prescribeDosage.trim() || undefined,
    };

    setActivePrescriptionsList(prev => {
      const updated = [...prev, newItem];
      const dosageStr = prescribeDosage.trim() ? `, dosage: ${prescribeDosage.trim()}` : '';
      const lineText = `💊 ${medication.name} (Qty: ${qty}${dosageStr})`;
      setPrescriptions(prevText => {
        const textLines = prevText.trim() ? prevText.trim().split('\n') : [];
        textLines.push(lineText);
        return textLines.join('\n');
      });
      return updated;
    });

    setSelectedMedicationId('');
    setPrescribeQty(1);
    setPrescribeDosage('');
  };

  const handleRemoveDrugFromPrescription = (index: number) => {
    setActivePrescriptionsList(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      const textLines = updated.map(item => {
        const dStr = item.dosage ? `, dosage: ${item.dosage}` : '';
        return `💊 ${item.name} (Qty: ${item.quantity}${dStr})`;
      });
      setPrescriptions(textLines.join('\n'));
      return updated;
    });
  };

  // Structured Laboratory Test Request Builder States
  const [selectedLabTestName, setSelectedLabTestName] = useState<string>('');
  const [activeLabTestsList, setActiveLabTestsList] = useState<{
    testId: string;
    testName: string;
    fee: number;
  }[]>([]);

  const handleAddTestToOrder = () => {
    if (!selectedLabTestName) {
      alert("Please select a lab test panel from the catalog list!");
      return;
    }
    const defaultMenu = [
      { name: 'Urinalysis', fee: 300 },
      { name: 'Malaria Rapid Diagnostic Test (RDT)', fee: 200 },
      { name: 'Complete Blood Count (CBC)', fee: 800 },
      { name: 'Liver Function Test (LFT)', fee: 1500 },
      { name: 'Renal Function Test (RFT)', fee: 1400 },
      { name: 'Blood Sugar (Fasting/Random)', fee: 200 },
      { name: 'Widal Test (Typhoid)', fee: 500 },
      { name: 'Stool Microscopy', fee: 300 },
      { name: 'HIV Rapid Test', fee: 0 }
    ];
    const catalogList = labCatalog.length > 0 ? labCatalog : defaultMenu;
    const found = catalogList.find(item => item.name === selectedLabTestName);
    if (!found) return;

    const newItem = {
      testId: `LT-${Math.floor(Math.random() * 100000)}`,
      testName: found.name,
      fee: found.fee
    };

    setActiveLabTestsList(prev => [...prev, newItem]);
    setSelectedLabTestName('');
  };

  const handleRemoveTestFromOrder = (index: number) => {
    setActiveLabTestsList(prev => prev.filter((_, idx) => idx !== index));
  };

  // New Appointment Form State
  const [apptPatientId, setApptPatientId] = useState<string>('');
  const [apptSearchTerm, setApptSearchTerm] = useState<string>('');
  const [isApptDropdownOpen, setIsApptDropdownOpen] = useState<boolean>(false);
  const [apptDate, setApptDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState<string>('09:00');
  const [apptCategory, setApptCategory] = useState<'General Consultation' | 'Consultant Clinic'>('General Consultation');
  const [apptSub, setApptSub] = useState<'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn'>('Surgical');
  const [apptFee, setApptFee] = useState<number>(300);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const patientId = `PT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const regDateTime = customRegDate ? `${customRegDate}T12:00:00Z` : new Date().toISOString();
    const newPatient: Patient = {
      id: patientId,
      opNumber: newOpNumber.trim() || `OP-${regDateTime.substring(0, 7)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: newName.trim(),
      age: Number(newAge),
      ageUnit: newAgeUnit,
      gender: newGender,
      phone: newPhone.trim(),
      category: newCategory,
      consultantSubCategory: newCategory === 'Consultant Clinic' ? newSubCategory : undefined,
      registeredAt: regDateTime,
      registeredBy: userEmail,
      medicalHistory: [],
      paymentMode: newPaymentMode,
      insuranceCompany: newPaymentMode === 'Insurance' ? newInsuranceCompany.trim() : undefined,
      isWalkIn: isWalkIn,
      walkInTag: isWalkIn ? walkInTag : undefined,
    };

    onAddPatient(newPatient);

    // Auto seed an appointment for registered billing
    const finalBillingAmount = newPaymentMode === 'Insurance' ? Number(insuranceConsultationPrice) : Number(customProcedureAmount);
    const apptId = `APT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newAppt: Appointment = {
      id: apptId,
      patientId,
      patientName: newName.trim(),
      patientPhone: newPhone.trim(),
      date: customRegDate || new Date().toISOString().split('T')[0],
      time: '12:00',
      category: newCategory,
      consultantSubCategory: newCategory === 'Consultant Clinic' ? newSubCategory : undefined,
      doctorEmail: 'doctor@tumutumu.org',
      status: 'Scheduled',
      billingStatus: 'Unpaid',
      billingAmount: finalBillingAmount,
    };
    onAddAppointment(newAppt);

    setNewName('');
    setNewAge(30);
    setNewAgeUnit('Years');
    setNewPhone('');
    setNewPaymentMode('Cash');
    setNewInsuranceCompany('');
    setIsWalkIn(false);
    setWalkInTag(undefined);
    alert(`Patient ${newPatient.name} standard registration compiled! Assigned Patient ID: ${patientId} & OP-Number: ${newPatient.opNumber}. A triage billing invoice of Ksh ${finalBillingAmount} has been generated under Appointments.`);
  };

  const handleAddMedicalHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curSelectedPatient) return;
    if (!symptoms.trim() || !diagnoses.trim()) return;

    // Strict Role-Based Check
    if (userRole !== 'Doctor' && userRole !== 'Admin') {
      alert('Security Protocol Alert: Record/Reception staff cannot write medical history diagnosis. Only doctors or administrators are whitelisted.');
      return;
    }

    const hasPrescriptions = activePrescriptionsList.length > 0;
    const hasLabTests = activeLabTestsList.length > 0;
    const rxTotal = activePrescriptionsList.reduce((sum, item) => sum + (item.quantity * (item.price * 1.33)), 0);
    const labTotal = activeLabTestsList.reduce((sum, item) => sum + item.fee, 0);
    const computedInvoiceAmount = (hasPrescriptions || hasLabTests) ? (rxTotal + labTotal) : undefined;

    const clinicalRecord: MedicalRecord = {
      id: `MR-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      symptoms: symptoms.trim(),
      diagnoses: diagnoses.trim(),
      notes: notes.trim(),
      prescriptions: prescriptions.trim(),
      doctorName: userName,
      doctorEmail: userEmail,
      ...(hasPrescriptions ? { prescribedItems: activePrescriptionsList } : {}),
      ...(hasLabTests ? { labTestsRequested: activeLabTestsList } : {}),
      ...((hasPrescriptions || hasLabTests) ? {
        billingStatus: 'Unpaid' as const,
        invoiceAmount: computedInvoiceAmount
      } : {})
    };

    onAddMedicalRecord(curSelectedPatient.id, clinicalRecord);

    // Dispatch requested lab tests to Lab Officer desk
    if (hasLabTests && onAddLabTest && curSelectedPatient) {
      activeLabTestsList.forEach(lt => {
        onAddLabTest({
          id: lt.testId,
          testName: lt.testName,
          patientName: curSelectedPatient.name,
          patientId: curSelectedPatient.id,
          testDate: new Date().toISOString().split('T')[0],
          performedBy: 'Pending Lab Officer',
          performedByEmail: '',
          result: 'Pending Analysis (Awaiting Payment at Cashier)',
          fee: lt.fee,
          billingStatus: 'Unpaid',
          recordId: clinicalRecord.id
        });
      });
    }

    // Refresh display
    const updatedParts = patients.find((p) => p.id === curSelectedPatient.id);
    if (updatedParts) {
      setCurSelectedPatient({
        ...updatedParts,
        medicalHistory: [...updatedParts.medicalHistory, clinicalRecord],
      });
    }

    setSymptoms('');
    setDiagnoses('');
    setNotes('');
    setPrescriptions('');
    setActivePrescriptionsList([]);
    setSelectedMedicationId('');
    setPrescribeQty(1);
    setPrescribeDosage('');
    setActiveLabTestsList([]);
    setSelectedLabTestName('');
    alert((hasPrescriptions || hasLabTests)
      ? `Clinical consult recorded! A combined cashier invoice of Ksh ${computedInvoiceAmount?.toLocaleString()} (Rx: Ksh ${rxTotal}, Labs: Ksh ${labTotal}) has been queued under Appointments & Billing.`
      : 'Medical record added successfully to safe EHR file.'
    );
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptPatientId) return;

    const matchedPat = patients.find((p) => p.id === apptPatientId);
    if (!matchedPat) return;

    const newAppt: Appointment = {
      id: `APT-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: apptPatientId,
      patientName: matchedPat.name,
      patientPhone: matchedPat.phone,
      date: apptDate,
      time: apptTime,
      category: apptCategory,
      consultantSubCategory: apptCategory === 'Consultant Clinic' ? apptSub : undefined,
      doctorEmail: 'doctor@tumutumu.org',
      status: 'Scheduled',
      billingStatus: 'Unpaid',
      billingAmount: apptFee,
    };

    onAddAppointment(newAppt);
    alert('Appointment booked successfully!');
    setApptPatientId('');
    setApptSearchTerm('');
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || 
                          p.id.toLowerCase().includes(q) || 
                          (p.opNumber && p.opNumber.toLowerCase().includes(q)) ||
                          (p.phone && p.phone.includes(q));
    if (filterCategory === 'all') return matchesSearch;
    if (filterCategory === 'general') return matchesSearch && p.category === 'General Consultation';
    if (filterCategory === 'walk-in-lab') return matchesSearch && p.category === 'Walk-in Lab';
    if (filterCategory === 'walk-in-pharmacy') return matchesSearch && p.category === 'Walk-in Pharmacy';
    if (filterCategory === 'outpatient-procedure') return matchesSearch && p.category === 'Outpatient Procedure';
    return matchesSearch && p.consultantSubCategory === filterCategory;
  }).sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header Style
    doc.setFillColor(31, 41, 55); // Deep slate header bar
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PCEA TUMUTUMU HOSPITAL', 14, 15);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Karatina Satellite Branch • Digitized Clinical EMR', 14, 21);
    doc.text('OFFICIAL ELECTRONIC PATIENT REGISTER', 14, 27);
    
    // Metadata block
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Archival Document Summary', 14, 45);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated By: ${userName || 'System Agent'} (${userEmail || 'EMR Reception Desk'})`, 14, 52);
    doc.text(`Generation Date: ${new Date().toLocaleString()}`, 14, 57);
    
    const activeFilterDesc = filterCategory === 'all' 
      ? 'All Consultation Categories' 
      : filterCategory === 'general' 
        ? 'General Consultation Clinic' 
        : filterCategory === 'walk-in-lab'
          ? 'Walk-in Lab'
          : filterCategory === 'walk-in-pharmacy'
            ? 'Walk-in Pharmacy'
            : filterCategory === 'outpatient-procedure'
              ? 'Outpatient Procedure'
              : `Consultant Specialty: ${filterCategory}`;
    const searchDesc = searchQuery ? `"${searchQuery}"` : 'None';
    doc.text(`Active Filters - Category: ${activeFilterDesc} | Search Query: ${searchDesc}`, 14, 62);
    doc.text(`Total Records Stamped: ${filteredPatients.length} Active Records`, 14, 67);

    // Decorative horizontal separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 72, 196, 72);

    // Prepare Table Headers and Body
    const headers = [['Patient ID', 'OP-Number', 'Patient Name', 'Age / Sex', 'Phone', 'Clinic / Department', 'Payment Method', 'Date Registered']];
    const rows = filteredPatients.map((p) => {
      const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
      const ageSex = `${p.age} ${p.ageUnit === 'Months' ? 'Mos' : 'Yrs'} / ${p.gender}`;
      const clinicDept = p.category === 'General Consultation' 
        ? 'General Consultation' 
        : `Consultant (${p.consultantSubCategory || 'N/A'})`;
      const payment = p.paymentMode === 'Insurance' 
        ? `Insurance (${p.insuranceCompany || 'N/A'})`
        : p.paymentMode === 'Cash' 
          ? 'Cash' 
          : 'N/A';
      return [
        p.id,
        op,
        p.name,
        ageSex,
        p.phone || 'N/A',
        clinicDept,
        payment,
        p.registeredAt ? p.registeredAt.substring(0, 10) : 'N/A'
      ];
    });

    // AutoTable layout
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 76,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 16 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { fontStyle: 'bold', cellWidth: 32 },
        3: { cellWidth: 18 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
        6: { cellWidth: 32 },
        7: { cellWidth: 22 }
      },
      didDrawPage: (data) => {
        // Page number and confidentiality footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        
        // Render confidentiality warning and page numbers on each page
        doc.text(
          'PCEA Tumutumu Hospital EMR Confidential Archival Document • Subject to Data Protection Acts', 
          14, 
          287
        );
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`, 
          196 - doc.getTextWidth(`Page ${data.pageNumber} of ${pageCount}`), 
          287
        );
      }
    });

    // Save File
    const timestamp = new Date().toISOString().substring(0, 10);
    const filterName = filterCategory.replace('/', '-').toLowerCase();
    doc.save(`tumutumu-patient-register-${filterName}-${timestamp}.pdf`);
  };

  const filteredEhrPatients = patients.filter((p) => {
    const query = ehrSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           p.id.toLowerCase().includes(query) || 
           (p.opNumber && p.opNumber.toLowerCase().includes(query)) ||
           p.phone.includes(query);
  }).sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));

  const filteredAppointments = appointments
    .filter((appt) => {
      const query = apptSearchQuery.toLowerCase().trim();
      if (!query) return true;
      const patient = patients.find((p) => p.id === appt.patientId);
      const op = patient?.opNumber || '';
      return (
        appt.patientName.toLowerCase().includes(query) ||
        appt.patientId.toLowerCase().includes(query) ||
        appt.id.toLowerCase().includes(query) ||
        op.toLowerCase().includes(query) ||
        (appt.category || '').toLowerCase().includes(query) ||
        (appt.consultantSubCategory || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const patA = patients.find((p) => p.id === a.patientId);
      const patB = patients.find((p) => p.id === b.patientId);
      const regA = patA?.registeredAt || `${a.date || ''}T${a.time || '00:00'}`;
      const regB = patB?.registeredAt || `${b.date || ''}T${b.time || '00:00'}`;

      if (regA !== regB) {
        return regB.localeCompare(regA);
      }

      const dateTimeA = `${a.date || ''}T${a.time || '00:00'}`;
      const dateTimeB = `${b.date || ''}T${b.time || '00:00'}`;
      return dateTimeB.localeCompare(dateTimeA);
    });

  return (
    <div id="reception-module" className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white border border-stone-200 rounded-xl p-1 flex gap-1">
        <button
          id="subtab-register"
          onClick={() => setActiveSubTab('register')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'register' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Intake & Patient Registration
        </button>
        <button
          id="subtab-history"
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Electronic Health Records (EHR)
        </button>
        <button
          id="subtab-appointments"
          onClick={() => setActiveSubTab('appointments')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'appointments' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Appointments & Billing Desk
        </button>
      </div>

      {/* 1. INTAKE & REGISTRATION FORM */}
      {activeSubTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed lg:col-span-1">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
              Patient Registration Form
            </h3>

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div>
                <label id="input-patient-name" className="block text-xs font-medium text-stone-500 mb-1">Full Patient Name</label>
                <input
                  id="reg-patient-name"
                  type="text"
                  required
                  placeholder="e.g. Grace Nyambura"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label id="input-patient-age" className="block text-xs font-medium text-stone-500 mb-1">Age</label>
                  <input
                    id="reg-patient-age"
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label id="input-patient-age-unit" className="block text-xs font-medium text-stone-500 mb-1">Unit</label>
                  <select
                    id="reg-patient-age-unit"
                    value={newAgeUnit}
                    onChange={(e) => {
                      const unit = e.target.value as 'Years' | 'Months';
                      setNewAgeUnit(unit);
                      if (unit === 'Months') {
                        setNewAge(newAge > 36 ? 6 : newAge);
                      } else {
                        setNewAge(newAge === 6 ? 30 : newAge);
                      }
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  >
                    <option value="Years">Years</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
                <div>
                  <label id="input-patient-gender" className="block text-xs font-medium text-stone-500 mb-1">Gender</label>
                  <select
                    id="reg-patient-gender"
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label id="input-patient-phone" className="block text-xs font-medium text-stone-500 mb-1">Mobile Contact Phone</label>
                <input
                  id="reg-patient-phone"
                  type="text"
                  required
                  placeholder="e.g. 0722000000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label id="input-patient-regdate" className="block text-xs font-medium text-stone-500 mb-1">Registration Date (Backdate Support)</label>
                <input
                  id="reg-patient-date"
                  type="date"
                  required
                  value={customRegDate}
                  onChange={(e) => setCustomRegDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label id="input-patient-opnumber" className="block text-xs font-medium text-stone-500 mb-1">Outpatient Clinic Number (OP Number)</label>
                <input
                  id="reg-patient-opnumber"
                  type="text"
                  required
                  placeholder="e.g. OP-2026-06-3841"
                  value={newOpNumber}
                  onChange={(e) => setNewOpNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">Auto-suggested based on selected registration date. Feel free to override.</span>
              </div>

              <div>
                <label id="input-patient-category" className="block text-xs font-medium text-stone-500 mb-1">Consultation Category</label>
                <select
                  id="reg-patient-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="General Consultation">General Consultation (Ksh 300)</option>
                  <option value="Consultant Clinic">Consultant Clinic Focus (Ksh 1500)</option>
                  <option value="Walk-in Lab">Walk-in Lab (Ksh 100)</option>
                  <option value="Walk-in Pharmacy">Walk-in Pharmacy (Ksh 100)</option>
                  <option value="Outpatient Procedure">Outpatient Procedure Walk-in</option>
                </select>
              </div>

              <div>
                <label id="input-procedure-amount" className="block text-xs font-medium text-stone-500 mb-1">
                  {newCategory === 'Outpatient Procedure' 
                    ? 'Procedure Amount / Cost (Ksh)' 
                    : newCategory === 'Walk-in Lab' || newCategory === 'Walk-in Pharmacy'
                      ? 'Walk-In Registration Fee (Ksh)'
                      : 'Consultation Fee Amount (Ksh)'}
                </label>
                <input
                  id="reg-procedure-amount"
                  type="number"
                  required
                  min={0}
                  disabled={newPaymentMode === 'Insurance'}
                  value={newPaymentMode === 'Insurance' ? insuranceConsultationPrice : customProcedureAmount}
                  onChange={(e) => {
                    if (newPaymentMode !== 'Insurance') {
                      setCustomProcedureAmount(Number(e.target.value));
                    }
                  }}
                  className={`w-full border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono ${
                    newPaymentMode === 'Insurance' ? 'bg-stone-100/90 text-stone-400 cursor-not-allowed' : 'bg-stone-50 text-stone-800'
                  }`}
                  placeholder="e.g. 500"
                />
                {newPaymentMode === 'Insurance' && (
                  <span className="text-[10px] text-amber-600 font-semibold block mt-1 leading-normal">
                    💡 Consultation fee is customized under Health Insurance Cover details below.
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <input
                  id="reg-patient-is-walk-in"
                  type="checkbox"
                  checked={isWalkIn}
                  onChange={(e) => handleWalkInToggle(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <label htmlFor="reg-patient-is-walk-in" className="text-xs font-semibold text-stone-700 cursor-pointer">
                    Identify as Walk-In Patient
                  </label>
                  <span className="text-[10px] text-stone-500">
                    Saves registry with a 'Walk-In' flag. Ideal for quick diagnostic testing or pharmacy-only sessions.
                  </span>
                </div>
              </div>

              {isWalkIn && (
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <label id="input-walkin-tag" className="block text-xs font-medium text-stone-600 mb-1">
                    Walk-In Specific Tag
                  </label>
                  <select
                    id="reg-walkin-tag"
                    value={walkInTag || 'Lab Walk-In'}
                    onChange={(e) => setWalkInTag(e.target.value as any)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  >
                    <option value="Lab Walk-In">Lab Direct Walk-In</option>
                    <option value="Pharmacy Walk-In">Pharmacy Direct Walk-In</option>
                    <option value="Outpatient Procedure Walk-In">Outpatient Procedure Walk-In</option>
                  </select>
                </div>
              )}

              {newCategory === 'Consultant Clinic' && (
                <div id="sub-clinic-container">
                  <label id="input-patient-subcat" className="block text-xs font-medium text-stone-500 mb-1">Clinic Department Specialist</label>
                  <select
                    id="reg-patient-subcat"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Surgical">Surgical Clinic</option>
                    <option value="Pediatrics">Pediatrics Clinic</option>
                    <option value="MOPC">MOPC (Medical Outpatient Clinic)</option>
                    <option value="Obs/Gyn">Obs/Gyn Clinic</option>
                  </select>
                </div>
              )}

              <div>
                <label id="input-patient-payment-mode" className="block text-xs font-medium text-stone-500 mb-1">Mode of Payment</label>
                <select
                  id="reg-patient-payment-mode"
                  value={newPaymentMode}
                  onChange={(e) => {
                    const val = e.target.value as 'Cash' | 'Insurance';
                    setNewPaymentMode(val);
                    if (val === 'Cash') setNewInsuranceCompany('');
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="Cash">Cash Basis</option>
                  <option value="Insurance">Health Insurance Cover</option>
                </select>
              </div>

              {newPaymentMode === 'Insurance' && (
                <div id="insurance-company-container" className="animate-in fade-in slide-in-from-top-1 duration-200 mt-2 space-y-3 bg-emerald-50/20 p-3 border border-emerald-100 rounded-lg">
                  <div>
                    <label id="input-patient-insurance-company" className="block text-xs font-semibold text-emerald-800 mb-1">Insurance Company Name</label>
                    <input
                      id="reg-patient-insurance-company"
                      type="text"
                      required
                      placeholder="e.g. NHIF / AAR / Jubilee"
                      value={newInsuranceCompany}
                      onChange={(e) => setNewInsuranceCompany(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label id="input-patient-insurance-price" className="block text-xs font-semibold text-emerald-800 mb-1">
                      Custom Insurance Consultation Price (Ksh)
                    </label>
                    <input
                      id="reg-patient-insurance-price"
                      type="number"
                      required
                      min={0}
                      value={insuranceConsultationPrice}
                      onChange={(e) => setInsuranceConsultationPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono font-bold text-emerald-900"
                    />
                    <span className="text-[10px] text-stone-500 block mt-1 leading-normal">
                      Specify cover rate for this insurance type (e.g. general vs premium card covers vary).
                    </span>
                  </div>
                </div>
              )}

              <button
                id="btn-register-patient"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded-lg transition-all"
              >
                Intake & Register Patient Record
              </button>
            </form>
          </div>

          {/* Roster of registered patients */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-stone-800">Branch Electronic Registers</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-download-pdf-register"
                  onClick={handleDownloadPDF}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Register
                </button>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 rounded-lg px-3 py-1.5 transition-all shadow-3xs w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <input
                    id="search-patient-input"
                    type="text"
                    placeholder="Search ID, name, OP No, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-xs outline-hidden border-hidden w-full text-stone-800 placeholder-stone-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      id="btn-clear-reg-search"
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stone-400 hover:text-stone-600 font-bold text-xs cursor-pointer px-1 shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-stone-100 pb-3 mb-3 shrink-0 flex-wrap">
              <button
                id="filter-clinic-all"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Patients
              </button>
              <button
                id="filter-clinic-general"
                onClick={() => setFilterCategory('general')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'general' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                General Consultation
              </button>
              <button
                id="filter-walk-in-lab"
                onClick={() => setFilterCategory('walk-in-lab')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'walk-in-lab' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                }`}
              >
                Walk-In Lab
              </button>
              <button
                id="filter-walk-in-pharmacy"
                onClick={() => setFilterCategory('walk-in-pharmacy')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'walk-in-pharmacy' ? 'bg-teal-600 text-white' : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                }`}
              >
                Walk-In Pharmacy
              </button>
              <button
                id="filter-outpatient-procedure"
                onClick={() => setFilterCategory('outpatient-procedure')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'outpatient-procedure' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                }`}
              >
                Outpatient Procedure
              </button>
              <option value="Surgical" disabled className="hidden"></option>
              {['Surgical', 'Pediatrics', 'MOPC', 'Obs/Gyn'].map((item) => (
                <button
                  id={`filter-clinic-${item}`}
                  key={item}
                  onClick={() => setFilterCategory(item)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                    filterCategory === item ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  Clinic: {item}
                </button>
              ))}
            </div>

            {searchQuery && (
              <div id="reception-search-match-badge" className="mb-4 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-100 flex justify-between items-center animate-in fade-in duration-100">
                <span>🔍 Showing <strong>{filteredPatients.length}</strong> matching {filteredPatients.length === 1 ? 'patient record' : 'patient records'} from the register...</span>
                <button
                  id="btn-clear-main-search-indicator"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-amber-800 hover:text-amber-950 font-bold ml-2 underline underline-offset-2 cursor-pointer text-[10px]"
                >
                  Show All
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-medium">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">OP Number</th>
                    <th className="py-2.5">Patient Name</th>
                    <th className="py-2.5">Age/Sex</th>
                    <th className="py-2.5">Phone Contact</th>
                    <th className="py-2.5">Inpatient Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredPatients.map((p) => (
                    <tr id={`p-row-${p.id}`} key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-mono text-stone-500">{p.id}</td>
                      <td className="py-2.5 font-mono font-semibold text-emerald-700">{p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`}</td>
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5">{p.age} {p.ageUnit === 'Months' ? 'Months' : 'Yrs'} / {p.gender}</td>
                      <td className="py-2.5">{p.phone}</td>
                      <td className="py-2.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            p.category === 'General Consultation' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : p.category === 'Consultant Clinic'
                                ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                : p.category === 'Walk-in Lab'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : p.category === 'Walk-in Pharmacy'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {p.category} {p.consultantSubCategory ? `(${p.consultantSubCategory})` : ''}
                          </span>
                          {p.paymentMode === 'Insurance' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-100 italic">
                              🛡️ Insurance: {p.insuranceCompany}
                            </span>
                          ) : p.paymentMode === 'Cash' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-500 border border-amber-100">
                              💵 Cash Basis
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">No patients recorded in filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ELECTRONIC HEALTH RECORDS (EHR) ACCESS/DETAILS */}
      {activeSubTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Selector List */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed max-h-[500px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4.5 h-4.5 text-emerald-600" />
              Patient Roster (Select Patient)
            </h3>

            {/* Real-time search filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 mb-4 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                id="search-ehr-input"
                type="text"
                placeholder="ID, OPD number, or name..."
                value={ehrSearchQuery}
                onChange={(e) => setEhrSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-hidden w-full text-stone-700"
              />
            </div>

            <div className="space-y-2">
              {filteredEhrPatients.map((p) => (
                <button
                  id={`btn-select-p-${p.id}`}
                  key={p.id}
                  onClick={() => setCurSelectedPatient(p)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all relative ${
                    curSelectedPatient?.id === p.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-stone-200 hover:bg-stone-50 bg-white'
                  }`}
                >
                  <p className="font-bold text-stone-900">{p.name}</p>
                  <div className="flex justify-between items-center text-stone-400 text-[10px] mt-1 pr-6">
                    <span>{p.id} • {p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`} • {p.gender} • {p.age} {p.ageUnit === 'Months' ? 'months' : 'yrs'}</span>
                    <span className="font-semibold text-stone-600">{p.consultantSubCategory || 'General'}</span>
                  </div>
                </button>
              ))}
              {filteredEhrPatients.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No matching patients cataloged.</p>
              )}
            </div>
          </div>

          {/* Active Patient EHR Dossier File */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2">
            {!curSelectedPatient ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center py-24">
                <FileText className="w-12 h-12 text-stone-200 mb-3" />
                <p className="text-xs">Select a patient from the left column to securely access, review, or append clinical diagnostic files.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header card with Role based alert notices */}
                <div className="border-b border-stone-100 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-bold text-slate-800">{curSelectedPatient.name} EHR Dossier</h3>
                    <p className="text-[10px] text-stone-500 font-mono mt-1">
                      ID: {curSelectedPatient.id} • OP-Number: {curSelectedPatient.opNumber || `OP-${(curSelectedPatient.registeredAt ? curSelectedPatient.registeredAt.substring(0, 7) : '2026-06')}-${curSelectedPatient.id.split('-')[1]}`} • Registered By: {curSelectedPatient.registeredBy} • Registered: {new Date(curSelectedPatient.registeredAt).toLocaleDateString()}
                    </p>
                    {curSelectedPatient.paymentMode && (
                      <p className="text-[10px] mt-2 font-medium flex items-center gap-1.5">
                        <span className="text-stone-400">Payment Coverage:</span>
                        {curSelectedPatient.paymentMode === 'Insurance' ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100 font-sans italic">
                            🛡️ Insurance Cover ({curSelectedPatient.insuranceCompany})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100 font-sans">
                            💵 Cash Basis
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full block ${
                      curSelectedPatient.category === 'General Consultation' 
                        ? 'bg-blue-100 text-blue-900' 
                        : curSelectedPatient.category === 'Consultant Clinic'
                          ? 'bg-teal-100 text-teal-950'
                          : 'bg-emerald-100 text-emerald-950'
                    }`}>
                      {curSelectedPatient.category === 'General Consultation' 
                        ? 'General OPD' 
                        : curSelectedPatient.category === 'Consultant Clinic'
                          ? `Consult: ${curSelectedPatient.consultantSubCategory}`
                          : curSelectedPatient.category}
                    </span>
                  </div>
                </div>

                {/* Captured Vitals Signs from Triage Desk */}
                {curSelectedPatient.vitals && (
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4.5 space-y-3 shadow-3xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Latest Triage Vitals Signs (Captured Today)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        curSelectedPatient.vitals.urgency === 'Emergent' ? 'bg-red-500 text-white animate-pulse' :
                        curSelectedPatient.vitals.urgency === 'Urgent' ? 'bg-amber-500 text-white' :
                        curSelectedPatient.vitals.urgency === 'Normal' ? 'bg-yellow-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Triage: {curSelectedPatient.vitals.urgency}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-rose-150/40 text-[11px] font-medium text-stone-700">
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Body Temperature</span>
                        <strong className="text-stone-900 font-mono text-xs">{curSelectedPatient.vitals.temperature} °C</strong>
                        {curSelectedPatient.vitals.temperature > 37.8 && <span className="text-[9px] text-red-500 block font-bold">Fever Spike</span>}
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Blood Pressure</span>
                        <strong className="text-stone-900 font-mono text-xs">{curSelectedPatient.vitals.bpSystolic}/{curSelectedPatient.vitals.bpDiastolic} mmHg</strong>
                        {(curSelectedPatient.vitals.bpSystolic >= 140 || curSelectedPatient.vitals.bpDiastolic >= 90) && (
                          <span className="text-[9px] text-amber-600 block font-bold">Hypertension</span>
                        )}
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Pulse Rate</span>
                        <strong className="text-stone-900 font-mono text-xs">{curSelectedPatient.vitals.pulse} bpm</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">SpO2 (Oxygen)</span>
                        <strong className="text-stone-900 font-mono text-xs">{curSelectedPatient.vitals.spo2 ? `${curSelectedPatient.vitals.spo2} %` : 'N/A'}</strong>
                        {curSelectedPatient.vitals.spo2 && curSelectedPatient.vitals.spo2 < 93 && (
                          <span className="text-[9px] text-red-600 font-bold block animate-pulse">Hypoxia Alert</span>
                        )}
                      </div>
                    </div>

                    {(curSelectedPatient.vitals.weight || curSelectedPatient.vitals.height || curSelectedPatient.vitals.respRate || curSelectedPatient.vitals.bloodSugar) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono px-1 text-stone-500">
                        {curSelectedPatient.vitals.weight && <div>Weight: <strong className="text-stone-700 font-bold">{curSelectedPatient.vitals.weight} kg</strong></div>}
                        {curSelectedPatient.vitals.height && <div>Height: <strong className="text-stone-700 font-bold">{curSelectedPatient.vitals.height} cm</strong></div>}
                        {curSelectedPatient.vitals.respRate && <div>Resp Rate: <strong className="text-stone-700 font-bold">{curSelectedPatient.vitals.respRate} /min</strong></div>}
                        {curSelectedPatient.vitals.bloodSugar && <div>Blood Sugar: <strong className="text-stone-700 font-bold">{curSelectedPatient.vitals.bloodSugar} mmol/L</strong></div>}
                      </div>
                    )}

                    <div className="bg-white/85 p-2.5 rounded-lg border border-stone-200 text-xs">
                      <span className="text-[9px] uppercase font-bold text-stone-400 block mb-0.5">Chief Symptom Complaint</span>
                      <p className="text-stone-800 font-medium italic">"{curSelectedPatient.vitals.chiefComplaint}"</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100">
                        <span className="text-[9px] text-stone-400">Captured by Triage Officer {curSelectedPatient.vitals.recordedBy} at {new Date(curSelectedPatient.vitals.recordedAt).toLocaleTimeString()}</span>
                        {(userRole === 'Doctor' || userRole === 'Admin') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSymptoms(curSelectedPatient.vitals?.chiefComplaint || '');
                              alert('Chief complaint copied to clinical symptoms text field!');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 rounded px-2 py-0.5 text-[10px] font-bold"
                          >
                            Copy to Symptom Form
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Secure Medical History Log */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-stone-400" />
                    Secure History Clinical Records ({curSelectedPatient.medicalHistory.length})
                  </h4>

                  {curSelectedPatient.medicalHistory.length === 0 ? (
                    <p className="text-xs text-stone-400 bg-stone-50 p-4 rounded-lg border border-stone-100">No medical consultations or health records logged for this patient yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {curSelectedPatient.medicalHistory.map((rec) => (
                        <div id={`medical-rec-card-${rec.id}`} key={rec.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-b border-stone-100 pb-1.5">
                            <span>Diagnostic Date: {rec.date}</span>
                            <span>Recorded By: {rec.doctorName} ({rec.doctorEmail})</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 leading-normal">
                            <div>
                              <p className="font-semibold text-stone-900">Symptoms</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1">{rec.symptoms}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">Diagnosis</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1 text-red-800 font-medium">{rec.diagnoses}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 leading-normal">
                            <div>
                              <p className="font-semibold text-stone-900">Prescriptions Provided</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1 font-semibold text-emerald-800">{rec.prescriptions || 'Nil presc.'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">Clinical Consultation Notes</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1">{rec.notes || 'No extra notes.'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Append Medical History Form (ROLE-BASED: DOCTORS/ADMIN ONLY) */}
                <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Append Clinical Consultation Report

                    {userRole !== 'Doctor' && userRole !== 'Admin' && (
                      <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.2 rounded-sm lowercase font-normal">
                        locked for role: {userRole}
                      </span>
                    )}
                  </h4>

                  {userRole !== 'Doctor' && userRole !== 'Admin' ? (
                    <div id="unauthorized-message-history" className="bg-amber-50 border border-amber-200 text-stone-600 rounded-lg p-3 text-xs leading-normal">
                      Security Protocol: Records, Lab, or Pharmacy accounts do not hold clinical consultation privileges. Please consult a whitelisted Medical Officer or Administrator to enter patient diagnoses in Karatina's EMR.
                    </div>
                  ) : (
                    <form onSubmit={handleAddMedicalHistory} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label id="lbl-symptoms" className="block text-[11px] font-medium text-stone-500 mb-1">Presented Symptoms</label>
                          <textarea
                            id="inp-symptoms"
                            required
                            rows={2}
                            placeholder="e.g. fever spikes, dry chest cough"
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                        <div>
                          <label id="lbl-diagnosis" className="block text-[11px] font-medium text-stone-500 mb-1">Clinical Diagnosis</label>
                          <textarea
                            id="inp-diagnosis"
                            required
                            rows={2}
                            placeholder="e.g. Lobar Pneumonia"
                            value={diagnoses}
                            onChange={(e) => setDiagnoses(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label id="lbl-prescriptions" className="block text-[11px] font-medium text-stone-500 mb-1">Prescriptions & Dispatches</label>
                          <textarea
                            id="inp-prescriptions"
                            required
                            rows={3}
                            placeholder="e.g. Amox 500mg TDS, Panadol 1g TDS"
                            value={prescriptions}
                            onChange={(e) => setPrescriptions(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                          ></textarea>

                          {/* Quick selection dropdown helper from Pharmacy Stock */}
                          <div className="mt-3 bg-stone-50 border border-stone-200/60 p-3 rounded-lg space-y-2">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 block">Available Pharmacy Stock Helper</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-medium text-stone-400">Drug Name</label>
                                <select
                                  id="select-prescribe-drug"
                                  value={selectedMedicationId}
                                  onChange={(e) => setSelectedMedicationId(e.target.value)}
                                  className="w-full bg-white border border-stone-200 rounded-md p-1.5 text-[11px] outline-hidden"
                                >
                                  <option value="">-- Choose Stock Drug --</option>
                                  {stock.map(item => (
                                    <option key={item.id} value={item.id} disabled={item.stockQuantity <= 0}>
                                      {item.name} (Qty: {item.stockQuantity} Left) - Ksh {item.price}/unit
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-medium text-stone-400">Qty to Prescribe</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={prescribeQty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setPrescribeQty('');
                                    } else {
                                      const parsed = parseInt(val, 10);
                                      setPrescribeQty(isNaN(parsed) ? '' : parsed);
                                    }
                                  }}
                                  className="w-full bg-white border border-stone-200 rounded-md p-1 px-2 text-[11px] text-center outline-hidden"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-[9px] font-medium text-stone-400">Dosage Instructions (e.g. "500mg TDS for 5 days")</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 500mg TDS for 5 days"
                                  value={prescribeDosage}
                                  onChange={(e) => setPrescribeDosage(e.target.value)}
                                  className="w-full bg-white border border-stone-200 rounded-md p-1 px-2 text-[11px] outline-hidden"
                                />
                              </div>
                              <button
                                type="button"
                                id="btn-add-to-prescription"
                                onClick={handleAddDrugToPrescription}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3 py-1.5 rounded-md font-medium shrink-0 border border-emerald-500"
                              >
                                Add Drug
                              </button>
                            </div>

                            {activePrescriptionsList.length > 0 && (
                              <div className="mt-2 border-t border-stone-200/50 pt-2 space-y-1">
                                <span className="text-[9px] font-medium text-stone-400 block">Itemized Active List:</span>
                                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                                  {activePrescriptionsList.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border border-stone-100 font-mono">
                                      <span className="truncate text-stone-700 font-semibold">{item.name} x{item.quantity} {item.dosage ? `(${item.dosage})` : ''}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-stone-500 font-bold">Ksh {(item.quantity * (item.price * 1.33)).toLocaleString()}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveDrugFromPrescription(index)}
                                          className="text-stone-400 hover:text-rose-600 font-sans px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-right text-[10px] font-semibold text-emerald-800 pr-1">
                                  Invoiced Total: Ksh {activePrescriptionsList.reduce((sum, item) => sum + (item.quantity * (item.price * 1.33)), 0).toLocaleString()}
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Structured Laboratory Test Request Builder */}
                          <div className="mt-3 bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg space-y-2">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-800 block flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-indigo-600" /> Order Laboratory Diagnostic Panels
                            </span>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-[9px] font-medium text-stone-500">Select Lab Test (Catalog Menu)</label>
                                <select
                                  id="select-lab-test-order"
                                  value={selectedLabTestName}
                                  onChange={(e) => setSelectedLabTestName(e.target.value)}
                                  className="w-full bg-white border border-stone-200 rounded-md p-1.5 text-[11px] outline-hidden"
                                >
                                  <option value="">-- Choose Lab Test --</option>
                                  {(labCatalog.length > 0 ? labCatalog : [
                                    { name: 'Urinalysis', fee: 300 },
                                    { name: 'Malaria Rapid Diagnostic Test (RDT)', fee: 200 },
                                    { name: 'Complete Blood Count (CBC)', fee: 800 },
                                    { name: 'Liver Function Test (LFT)', fee: 1500 },
                                    { name: 'Renal Function Test (RFT)', fee: 1400 },
                                    { name: 'Blood Sugar (Fasting/Random)', fee: 200 },
                                    { name: 'Widal Test (Typhoid)', fee: 500 },
                                    { name: 'Stool Microscopy', fee: 300 },
                                    { name: 'HIV Rapid Test', fee: 0 }
                                  ]).map((item, i) => (
                                    <option key={i} value={item.name}>
                                      {item.name} (Ksh {item.fee.toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                id="btn-add-lab-test-order"
                                onClick={handleAddTestToOrder}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3 py-1.5 rounded-md font-medium shrink-0 border border-indigo-500"
                              >
                                Add Lab Test
                              </button>
                            </div>

                            {activeLabTestsList.length > 0 && (
                              <div className="mt-2 border-t border-indigo-100 pt-2 space-y-1">
                                <span className="text-[9px] font-medium text-indigo-400 block">Ordered Lab Panel List:</span>
                                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                                  {activeLabTestsList.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border border-indigo-100 font-mono">
                                      <span className="truncate text-indigo-950 font-semibold">{item.testName}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-indigo-600 font-bold">Ksh {item.fee.toLocaleString()}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTestFromOrder(index)}
                                          className="text-stone-400 hover:text-rose-600 font-sans px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-right text-[10px] font-semibold text-indigo-900 pr-1">
                                  Lab Fees Total: Ksh {activeLabTestsList.reduce((sum, item) => sum + item.fee, 0).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label id="lbl-notes" className="block text-[11px] font-medium text-stone-500 mb-1">Management & Advice Notes</label>
                          <textarea
                            id="inp-notes"
                            rows={2}
                            placeholder="Check blood sugar, bed rest 3 days"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                      </div>

                      <button
                        id="btn-add-medical-rec"
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                      >
                        Append Consult to EHR Record
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. APPOINTMENTS & BILLING SCREEN */}
      {activeSubTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Appointment Booking Desk */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              Book Appointment Invoice
            </h3>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label id="lbl-appt-patient" className="block font-semibold text-stone-600 mb-1 flex justify-between items-center">
                  <span>Select Patient (Real-time Search)</span>
                  {apptPatientId ? (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                      ID Selected: {apptPatientId}
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 italic font-normal">
                      Search by Name, ID, or OP number
                    </span>
                  )}
                </label>
                
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
                    <input
                      id="input-appt-patient-search"
                      type="text"
                      placeholder="Type patient name, ID, phone, or OP number..."
                      value={apptSearchTerm}
                      onFocus={() => setIsApptDropdownOpen(true)}
                      onChange={(e) => {
                        setApptSearchTerm(e.target.value);
                        setIsApptDropdownOpen(true);
                        // If exact match name or ID is entered, select it
                        const matched = patients.find(
                          (pat) =>
                            pat.id.toLowerCase() === e.target.value.toLowerCase() ||
                            pat.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (matched) {
                          setApptPatientId(matched.id);
                        } else {
                          setApptPatientId('');
                        }
                      }}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded-lg p-2 pl-9 pr-14 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium"
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                      {apptSearchTerm && (
                        <button
                          id="btn-clear-appt-search"
                          type="button"
                          onClick={() => {
                            setApptSearchTerm('');
                            setApptPatientId('');
                          }}
                          className="text-stone-400 hover:text-stone-600 font-bold text-xs cursor-pointer px-1"
                          title="Clear Search"
                        >
                          ×
                        </button>
                      )}
                      <button
                        id="btn-toggle-appt-dropdown"
                        type="button"
                        onClick={() => setIsApptDropdownOpen(!isApptDropdownOpen)}
                        className="text-stone-400 hover:text-stone-600 text-[10px] cursor-pointer"
                        title="Toggle Patient Menu"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {isApptDropdownOpen && (
                    <>
                      {/* Click outside backdrop to close overlay */}
                      <div
                        id="com-dropdown-backdrop"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => {
                          setIsApptDropdownOpen(false);
                          if (apptPatientId) {
                            const p = patients.find(pat => pat.id === apptPatientId);
                            if (p) {
                              setApptSearchTerm(`${p.name} (${p.id})`);
                            }
                          } else {
                            setApptSearchTerm('');
                          }
                        }}
                      />
                      
                      <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-stone-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        {patients
                          .filter((p) => {
                            const query = apptSearchTerm.toLowerCase();
                            return (
                              p.name.toLowerCase().includes(query) ||
                              p.id.toLowerCase().includes(query) ||
                              (p.opNumber && p.opNumber.toLowerCase().includes(query)) ||
                              (p.phone && p.phone.includes(query))
                            );
                          })
                          .sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''))
                          .map((pat) => (
                            <div
                              id={`appt-patient-option-${pat.id}`}
                              key={pat.id}
                              onClick={() => {
                                setApptPatientId(pat.id);
                                setApptSearchTerm(`${pat.name} (${pat.id})`);
                                setIsApptDropdownOpen(false);
                              }}
                              className={`p-2.5 hover:bg-stone-50 cursor-pointer text-[11px] transition-all flex flex-col ${
                                apptPatientId === pat.id ? 'bg-emerald-50 text-emerald-900 border-l-2 border-emerald-500 font-medium' : 'text-stone-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">{pat.name}</span>
                                <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded-sm">
                                  {pat.opNumber || `OP-${pat.id}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-stone-400 text-[9px] mt-1">
                                <span>Ref: {pat.id} • {pat.gender} • {pat.age} {pat.ageUnit === 'Months' ? 'months' : 'yrs'}</span>
                                <span className="italic font-medium text-[8px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded">
                                  Coverage: {pat.paymentMode}
                                </span>
                              </div>
                            </div>
                          ))}
                        {patients.filter((p) => {
                          const query = apptSearchTerm.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(query) ||
                            p.id.toLowerCase().includes(query) ||
                            (p.opNumber && p.opNumber.toLowerCase().includes(query)) ||
                            (p.phone && p.phone.includes(query))
                          );
                        }).length === 0 && (
                          <div className="p-3.5 text-center text-stone-400 text-[11px]">
                            No patients found matching "{apptSearchTerm}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Validation helper to ensure form submission tracks select validity */}
                <input
                  type="hidden"
                  name="apptPatientId"
                  value={apptPatientId}
                  required
                />
                {!apptPatientId && (
                  <span className="text-[10px] text-rose-500 block mt-1 leading-normal">
                    ⚠️ Please select a patient using the real-time search lookup to book.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label id="lbl-appt-date" className="block font-medium text-stone-500 mb-1">Consultation Date</label>
                  <input
                    id="inp-appt-date"
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label id="lbl-appt-time" className="block font-medium text-stone-500 mb-1">Consultation Time</label>
                  <input
                    id="inp-appt-time"
                    type="time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label id="lbl-appt-category" className="block font-medium text-stone-500 mb-1">Category</label>
                  <select
                    id="select-appt-category"
                    value={apptCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setApptCategory(cat);
                      setApptFee(cat === 'General Consultation' ? 300 : 1500);
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="General Consultation">General Consult</option>
                    <option value="Consultant Clinic">Consultant Clinic</option>
                  </select>
                </div>

                <div>
                  <label id="lbl-appt-fee" className="block font-medium text-stone-500 mb-1">Invoice Fee (Ksh)</label>
                  <input
                    id="inp-appt-fee"
                    type="number"
                    required
                    value={apptFee}
                    onChange={(e) => setApptFee(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {apptCategory === 'Consultant Clinic' && (
                <div>
                  <label id="lbl-appt-sub" className="block font-medium text-stone-500 mb-1">Sub Clinic</label>
                  <select
                    id="select-appt-sub"
                    value={apptSub}
                    onChange={(e) => setApptSub(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Surgical">Surgical</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="MOPC">MOPC</option>
                    <option value="Obs/Gyn">Obs/Gyn</option>
                  </select>
                </div>
              )}

              <button
                id="btn-book-appt"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded-lg transition-all"
              >
                Assemble & Commit Appointment Book
              </button>
            </form>
          </div>

          {/* Appointment list & Invoice billing receipt desk */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Hospital Billing Registers</h3>
                <p className="text-[10px] text-stone-400 mt-0.5 font-sans">
                  Sorted with the most recent patients first
                </p>
              </div>
              <div className="relative max-w-xs w-full">
                <input
                  id="search-appointments"
                  type="text"
                  placeholder="Search patient, ID, OP-No or clinic..."
                  value={apptSearchQuery}
                  onChange={(e) => setApptSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-sans placeholder-stone-400 text-stone-800"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-medium">
                    <th className="py-2.5">Date/Time</th>
                    <th className="py-2.5">Patient Details</th>
                    <th className="py-2.5">Clinic Focus</th>
                    <th className="py-2.5">Cost Code</th>
                    <th className="py-2.5">Invoicing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredAppointments.map((appt) => (
                    <tr id={`appt-tr-${appt.id}`} key={appt.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-mono text-stone-600">
                        {appt.date} <span className="text-[10px] text-stone-400">@{appt.time}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold block text-stone-900">{appt.patientName}</span>
                        {(() => {
                          const patient = patients.find((p) => p.id === appt.patientId);
                          const op = patient?.opNumber || (patient ? `OP-${(patient.registeredAt ? patient.registeredAt.substring(0, 7) : '2026-06')}-${patient.id.split('-')[1]}` : '');
                          return (
                            <span className="text-[10px] text-stone-400 font-mono block">
                              Patient Ref: {appt.patientId} {op && `• OP-No: ${op}`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-stone-200">
                          {appt.category} {appt.consultantSubCategory ? `(${appt.consultantSubCategory})` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-neutral-900">
                        Ksh {appt.billingAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        {appt.billingStatus === 'Paid' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100 inline-flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" /> Checked Out (Paid)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 rounded-full border border-rose-100 shrink-0">Unpaid</span>
                            <button
                              id={`btn-collect-pay-${appt.id}`}
                              onClick={() => {
                                onUpdateAppointmentBilling(appt.id, 'Paid');
                                alert('Billing transaction reported safely. Revenue generation logged under Department Reports.');
                              }}
                              className="bg-stone-800 hover:bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded border border-stone-700 cursor-pointer"
                            >
                              Collect Cash
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 font-mono">
                        {appointments.length === 0 
                          ? "No invoice items compiled under billing registers." 
                          : "No matching appointment records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pharmacy & Lab Invoices Desk */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-800">Clinical Prescriptions & Lab Invoices Desk</h3>
              <span className="text-[10px] text-stone-400 font-mono">Active clinical orders awaiting billing checkout</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-medium">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Patient Details</th>
                    <th className="py-2.5">Items Ordered</th>
                    <th className="py-2.5">Total Bill</th>
                    <th className="py-2.5">Invoicing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {(() => {
                    const invoices = patients.flatMap(patient => {
                      return (patient.medicalHistory || [])
                        .filter(record => (record.prescribedItems && record.prescribedItems.length > 0) || (record.labTestsRequested && record.labTestsRequested.length > 0))
                        .map(record => ({
                          patientId: patient.id,
                          patientName: patient.name,
                          opNumber: patient.opNumber,
                          recordId: record.id,
                          date: record.date,
                          prescribedItems: record.prescribedItems || [],
                          labTestsRequested: record.labTestsRequested || [],
                          billingStatus: record.billingStatus || 'Unpaid',
                          invoiceAmount: record.invoiceAmount || 0,
                          doctorName: record.doctorName,
                          paymentMode: patient.paymentMode || 'Cash',
                          insuranceCompany: patient.insuranceCompany
                        }));
                    }).sort((a, b) => b.date.localeCompare(a.date));

                    if (invoices.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-stone-400">No clinical prescription or lab invoices found.</td>
                        </tr>
                      );
                    }

                    return invoices.map((inv) => (
                      <tr id={`phm-inv-${inv.recordId}`} key={inv.recordId} className="hover:bg-stone-50/50">
                        <td className="py-2.5 font-mono">{inv.date}</td>
                        <td className="py-2.5">
                          <span className="font-semibold block">{inv.patientName}</span>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            OP-No: {inv.opNumber} • ID: {inv.patientId}
                          </span>
                          <span className="text-[10px] text-stone-500 block">
                            Pay Mode: <strong className="font-semibold text-stone-700">{inv.paymentMode}</strong>
                            {inv.paymentMode === 'Insurance' && ` (${inv.insuranceCompany})`}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="space-y-0.5">
                            {inv.prescribedItems.map((item, idx) => (
                              <div key={`rx-${idx}`} className="text-[10px] text-stone-600 font-mono">
                                • [Rx] {item.name} x{item.quantity} (Ksh {item.price}/u)
                              </div>
                            ))}
                            {inv.labTestsRequested?.map((item, idx) => (
                              <div key={`lab-${idx}`} className="text-[10px] text-indigo-700 font-mono font-semibold">
                                • [Lab] {item.testName} (Ksh {item.fee})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 font-semibold text-neutral-900">
                          Ksh {inv.invoiceAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-col sm:flex-row gap-1.5 items-start">
                            {inv.billingStatus === 'Unpaid' ? (
                              <button
                                id={`btn-pay-phm-${inv.recordId}`}
                                onClick={() => {
                                  if (onUpdatePatientHistory) {
                                    const patient = patients.find(p => p.id === inv.patientId);
                                    if (patient) {
                                      const updatedHistory = (patient.medicalHistory || []).map(record => {
                                        if (record.id === inv.recordId) {
                                          return { ...record, billingStatus: 'Paid' as const };
                                        }
                                        return record;
                                      });
                                      onUpdatePatientHistory(inv.patientId, updatedHistory);
                                      if (onUpdateLabTest && labTests) {
                                        labTests.forEach(lt => {
                                          if (lt.recordId === inv.recordId && lt.billingStatus === 'Unpaid') {
                                            onUpdateLabTest({ ...lt, billingStatus: 'Paid' });
                                          }
                                        });
                                      }
                                      alert("Payment registered! Rx ready for pharmacy dispensing and Lab orders cleared for analysis.");
                                    }
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-1 rounded font-medium border border-emerald-500"
                              >
                                Mark Paid
                              </button>
                            ) : inv.billingStatus === 'Paid' ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100 inline-flex items-center gap-1">
                                Paid (Pending Dispense)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-100 inline-flex items-center gap-1">
                                Dispensed
                              </span>
                            )}
                            
                            <button
                              id={`btn-pdf-phm-${inv.recordId}`}
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
                                doc.text(`Bill Ref: PHM-INV-${inv.recordId} • Date: ${inv.date}`, 14, 31);
                                
                                doc.setDrawColor(229, 231, 235);
                                doc.line(14, 36, 196, 36);
                                
                                doc.setFont("Helvetica", "bold");
                                doc.setFontSize(10);
                                doc.text("BILLING & RX RECEIPT DETAILS:", 14, 44);
                                
                                doc.setFont("Helvetica", "normal");
                                doc.setFontSize(9);
                                doc.text(`Patient Name: ${inv.patientName}`, 14, 50);
                                doc.text(`Reference ID: ${inv.patientId} • OP Number: ${inv.opNumber || 'N/A'}`, 14, 55);
                                doc.text(`Payment Mode: ${inv.paymentMode} ${inv.paymentMode === 'Insurance' ? `(${inv.insuranceCompany || 'N/A'})` : ''}`, 14, 60);
                                doc.text(`Prescribed By: Dr. ${inv.doctorName}`, 14, 65);
                                doc.text(`Invoiced Amount: Ksh ${inv.invoiceAmount.toLocaleString()} (${inv.billingStatus.toUpperCase()})`, 14, 70);
                                
                                const rows = inv.prescribedItems.map((item: any, idx: number) => [
                                  idx + 1,
                                  item.name,
                                  item.quantity,
                                  `Ksh ${item.price.toLocaleString()}`,
                                  `Ksh ${(item.quantity * (item.price * 1.33)).toLocaleString()}`
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
                                doc.text(`TOTAL CHARGED: Ksh ${inv.invoiceAmount.toLocaleString()}`, 14, finalRowY);
                                doc.text(`RECEIPT STATUS: ${inv.billingStatus === 'Unpaid' ? 'UNPAID / PENDING' : 'PAID & REGISTERED'}`, 14, finalRowY + 5);
                                
                                doc.setFont("Helvetica", "italic");
                                doc.text("Serving Nyeri County with dignity and care. Quick Recovery!", 14, finalRowY + 15);
                                
                                doc.save(`Rx_Invoice_${inv.patientName.replace(/\s+/g, '_')}_${inv.recordId}.pdf`);
                              }}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] px-2 py-1 rounded inline-flex items-center gap-1 border border-stone-300"
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
        </div>
      )}

      {/* 4. VIEW PATIENT CARD SCREEN */}
      {activeSubTab === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left Column: Patient Search List */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Patient Lookup Directory
            </h3>
            <input
              type="text"
              placeholder="Search Name or OP Number..."
              value={cardSearchQuery}
              onChange={(e) => setCardSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {patients
                .filter(p => {
                  const q = cardSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return p.name.toLowerCase().includes(q) ||
                         p.id.toLowerCase().includes(q) ||
                         (p.opNumber || '').toLowerCase().includes(q) ||
                         p.phone.includes(q);
                })
                .sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''))
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedCardPatient(p)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedCardPatient?.id === p.id ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs' : 'border-stone-200 hover:bg-stone-50 bg-white'
                    }`}
                  >
                    <p className="font-bold text-stone-900">{p.name}</p>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                      {p.opNumber || `OP-${p.id}`} • {p.gender} • {p.age} {p.ageUnit === 'Months' ? 'm' : 'y'}
                    </p>
                  </button>
                ))
              }
            </div>
          </div>

          {/* Right Column: Complete Patient Dossier Card */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2">
            {!selectedCardPatient ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center py-24">
                <Stethoscope className="w-12 h-12 text-stone-200 mb-3 animate-bounce" />
                <p className="text-xs">Search and select a patient from the directory to review their comprehensive clinical history, prescriptions, and real-time laboratory diagnostic reports.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dossier Header */}
                <div className="border-b border-stone-100 pb-4 flex justify-between items-start bg-slate-900 text-white p-5 rounded-xl shadow-md">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      {selectedCardPatient.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-300 mt-1">
                      OP Number: {selectedCardPatient.opNumber || `OP-${selectedCardPatient.id}`} • Ref ID: {selectedCardPatient.id}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {selectedCardPatient.gender} • {selectedCardPatient.age} {selectedCardPatient.ageUnit === 'Months' ? 'months' : 'years'} • Phone: {selectedCardPatient.phone}
                    </p>
                    <p className="text-[10px] text-emerald-300 font-semibold mt-2">
                      Coverage: {selectedCardPatient.paymentMode || 'Cash'} {selectedCardPatient.insuranceCompany ? `(${selectedCardPatient.insuranceCompany})` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase block">
                      Active EMR Record
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-2 block">
                      Reg: {new Date(selectedCardPatient.registeredAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Section 1: Previous Diagnoses & Clinical History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono border-b border-stone-100 pb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Previous Consultations & Diagnoses ({selectedCardPatient.medicalHistory?.length || 0})
                  </h4>
                  {(!selectedCardPatient.medicalHistory || selectedCardPatient.medicalHistory.length === 0) ? (
                    <p className="text-xs text-stone-400 italic py-2">No previous consultation notes cataloged.</p>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {selectedCardPatient.medicalHistory.map((rec, idx) => (
                        <div key={idx} className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-b border-stone-200/50 pb-1">
                            <span>Date: <strong className="text-stone-800">{rec.date}</strong></span>
                            <span>Doctor: <strong className="text-stone-800">{rec.doctorName || 'Attending Physician'}</strong></span>
                          </div>
                          <div><strong className="text-stone-600">Symptoms:</strong> {rec.symptoms}</div>
                          <div><strong className="text-emerald-800">Diagnosis:</strong> {rec.diagnoses}</div>
                          {rec.notes && <div><strong className="text-stone-600">Notes/Advice:</strong> {rec.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Previous Prescriptions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono border-b border-stone-100 pb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Previous Medications & Prescriptions
                  </h4>
                  {(() => {
                    const allRx = (selectedCardPatient.medicalHistory || []).filter(rec => rec.prescribedItems && rec.prescribedItems.length > 0);
                    if (allRx.length === 0) {
                      return <p className="text-xs text-stone-400 italic py-2">No dispensed or queued prescriptions found.</p>;
                    }
                    return (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {allRx.map((rec, i) => (
                          <div key={i} className="bg-teal-50/40 border border-teal-100 rounded-lg p-2.5 text-xs space-y-1 font-mono">
                            <div className="text-[9px] text-teal-800 font-bold">Ordered on {rec.date} by {rec.doctorName}:</div>
                            {rec.prescribedItems?.map((drg, di) => (
                              <div key={di} className="text-[10px] text-stone-700 pl-2">
                                • {drg.name} (Qty: {drg.quantity}) {drg.dosage ? `- ${drg.dosage}` : ''}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Section 3: Previous Lab Test Results */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono border-b border-stone-100 pb-1.5 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    Previous Laboratory Diagnostics & Results
                  </h4>
                  {(() => {
                    const patientLabs = labTests.filter(lt => lt.patientId === selectedCardPatient.id || lt.patientName.toLowerCase() === selectedCardPatient.name.toLowerCase());
                    if (patientLabs.length === 0) {
                      return <p className="text-xs text-stone-400 italic py-2">No laboratory diagnostic panels requested or performed.</p>;
                    }
                    return (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {patientLabs.map((lt, li) => (
                          <div key={li} className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center font-mono text-[10px]">
                              <span className="font-bold text-indigo-950">{lt.testName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                lt.billingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                lt.billingStatus === 'Paid' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {lt.billingStatus || 'Unpaid'}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              Date: {lt.testDate} • Officer: {lt.performedBy} • Fee: Ksh {lt.fee}
                            </div>
                            <div className="bg-white border border-indigo-100/80 p-2 rounded text-[11px] font-mono text-stone-800 shadow-2xs">
                              <strong className="text-indigo-700 block text-[9px] uppercase">Results / Analysis:</strong>
                              {lt.result}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
