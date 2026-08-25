/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Microscope, 
  Pill, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  CreditCard,
  FileText,
  Clock,
  Shield,
  Activity,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { Patient, Appointment, LabTest, MedicationDispense, PharmacyItem, Expense, DutyAllocation, LeaveRequest, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SupervisorViewProps {
  patients: Patient[];
  appointments: Appointment[];
  labTests: LabTest[];
  dispenses: MedicationDispense[];
  stock: PharmacyItem[];
  expenses: Expense[];
  duties?: DutyAllocation[];
  leaves?: LeaveRequest[];
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (expenseId: string) => void;
  userName: string;
  userEmail: string;
  userRole?: UserRole;
}

export function SupervisorView({
  patients = [],
  appointments = [],
  labTests = [],
  dispenses = [],
  stock = [],
  expenses = [],
  duties = [],
  leaves = [],
  onAddExpense,
  onRemoveExpense,
  userName,
  userEmail,
  userRole
}: SupervisorViewProps) {
  // Period filter states
  const [periodMode, setPeriodMode] = useState<'today' | 'month' | 'year' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to latest date in patients or today
    if (patients.length > 0) {
      const dates = patients.map(p => p.registeredAt ? p.registeredAt.substring(0, 10) : '').filter(Boolean).sort().reverse();
      if (dates.length > 0) return dates[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (patients.length > 0) {
      const dates = patients.map(p => p.registeredAt ? p.registeredAt.substring(0, 7) : '').filter(Boolean).sort().reverse();
      if (dates.length > 0) return dates[0];
    }
    return new Date().toISOString().substring(0, 7);
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    if (patients.length > 0) {
      const dates = patients.map(p => p.registeredAt ? p.registeredAt.substring(0, 4) : '').filter(Boolean).sort().reverse();
      if (dates.length > 0) return dates[0];
    }
    return new Date().getFullYear().toString();
  });

  // Active section tab
  const [activeSection, setActiveSection] = useState<'overview' | 'departments' | 'insurance' | 'expenses' | 'reports'>('overview');

  // Expense modal & form states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('Medical Supplies & Drugs');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseRecordedBy, setExpenseRecordedBy] = useState<string>(userName || 'Overall Supervisor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter Helper for dates
  const isDateInPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.substring(0, 10);
    if (periodMode === 'today') {
      return cleanDate === selectedDate;
    }
    if (periodMode === 'month') {
      return dateStr.substring(0, 7) === selectedMonth;
    }
    if (periodMode === 'year') {
      return dateStr.substring(0, 4) === selectedYear;
    }
    return cleanDate === selectedDate;
  };

  // 1. Filtered Data Sets for the selected period
  const periodPatients = useMemo(() => {
    return patients.filter(p => isDateInPeriod(p.registeredAt));
  }, [patients, periodMode, selectedDate, selectedMonth, selectedYear]);

  const periodAppointments = useMemo(() => {
    return appointments.filter(a => isDateInPeriod(a.date));
  }, [appointments, periodMode, selectedDate, selectedMonth, selectedYear]);

  const periodLabTests = useMemo(() => {
    return labTests.filter(t => isDateInPeriod(t.testDate));
  }, [labTests, periodMode, selectedDate, selectedMonth, selectedYear]);

  const periodDispenses = useMemo(() => {
    return dispenses.filter(d => isDateInPeriod(d.dispenseDate));
  }, [dispenses, periodMode, selectedDate, selectedMonth, selectedYear]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => isDateInPeriod(e.date));
  }, [expenses, periodMode, selectedDate, selectedMonth, selectedYear]);

  // 2. Departmental Computations
  // A. General Consultation
  const genConsultationPatients = useMemo(() => {
    return periodPatients.filter(p => p.category === 'General Consultation' || (!p.category && !p.isWalkIn));
  }, [periodPatients]);

  // B. Specialist / Consultant Clinics Breakdown
  const specialistPatients = useMemo(() => {
    return periodPatients.filter(p => p.category === 'Consultant Clinic');
  }, [periodPatients]);

  const surgicalCount = useMemo(() => {
    return specialistPatients.filter(p => p.consultantSubCategory === 'Surgical').length;
  }, [specialistPatients]);

  const pediatricsCount = useMemo(() => {
    return specialistPatients.filter(p => p.consultantSubCategory === 'Pediatrics').length;
  }, [specialistPatients]);

  const mopcCount = useMemo(() => {
    return specialistPatients.filter(p => p.consultantSubCategory === 'MOPC').length;
  }, [specialistPatients]);

  const obsGynCount = useMemo(() => {
    return specialistPatients.filter(p => p.consultantSubCategory === 'Obs/Gyn').length;
  }, [specialistPatients]);

  const otherSpecialistCount = useMemo(() => {
    return specialistPatients.length - (surgicalCount + pediatricsCount + mopcCount + obsGynCount);
  }, [specialistPatients, surgicalCount, pediatricsCount, mopcCount, obsGynCount]);

  // Walk-in Procedures / others
  const walkInProcedurePatients = useMemo(() => {
    return periodPatients.filter(p => p.category === 'Outpatient Procedure' || p.category === 'Walk-in Lab' || p.category === 'Walk-in Pharmacy' || p.isWalkIn);
  }, [periodPatients]);

  // Real Appointment Billing Records
  const periodPaidAppts = useMemo(() => {
    return periodAppointments.filter(a => a.billingStatus === 'Paid' || a.status === 'Completed' || (Number(a.billingAmount) || 0) > 0);
  }, [periodAppointments]);

  const genOpdRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.category === 'General Consultation' || (!a.category && !a.consultantSubCategory))
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const surgicalRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.consultantSubCategory === 'Surgical' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('surg')))
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const pediatricsRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.consultantSubCategory === 'Pediatrics' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('ped')))
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const mopcRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.consultantSubCategory === 'MOPC' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('mopc')))
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const obsGynRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.consultantSubCategory === 'Obs/Gyn' || (a.category === 'Consultant Clinic' && ((a.notes || '').toLowerCase().includes('gyn') || (a.notes || '').toLowerCase().includes('obs'))))
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const walkInProcedureRevenue = useMemo(() => {
    return periodPaidAppts
      .filter(a => a.category === 'Outpatient Procedure' || a.category === 'Walk-in Lab' || a.category === 'Walk-in Pharmacy')
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  const consultationRevenue = useMemo(() => {
    return periodPaidAppts.reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);
  }, [periodPaidAppts]);

  // D. Laboratory Summary
  const labRevenue = useMemo(() => {
    return periodLabTests.reduce((sum, t) => sum + (Number(t.fee) || 0), 0);
  }, [periodLabTests]);

  const popularLabTests = useMemo(() => {
    const counts: Record<string, number> = {};
    periodLabTests.forEach(t => {
      const name = t.testName || 'General Lab Test';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [periodLabTests]);

  // E. Pharmacy Summary
  const pharmacyRevenue = useMemo(() => {
    return periodDispenses.reduce((sum, d) => sum + (Number(d.totalCost) || 0), 0);
  }, [periodDispenses]);

  const lowStockCount = useMemo(() => {
    return stock.filter(item => item.stockQuantity <= (item.minThreshold || 10)).length;
  }, [stock]);

  // C. Insurance Breakdown with REAL recorded patient revenues
  const insuranceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; realRevenue: number; patients: Patient[] }> = {
      'NHIF / SHA': { count: 0, realRevenue: 0, patients: [] },
      'Jubilee Insurance': { count: 0, realRevenue: 0, patients: [] },
      'AAR Insurance': { count: 0, realRevenue: 0, patients: [] },
      'Britam': { count: 0, realRevenue: 0, patients: [] },
      'CIC Insurance': { count: 0, realRevenue: 0, patients: [] },
      'APA Insurance': { count: 0, realRevenue: 0, patients: [] },
      'First Assurance': { count: 0, realRevenue: 0, patients: [] },
      'Madison Insurance': { count: 0, realRevenue: 0, patients: [] },
      'UAP Old Mutual': { count: 0, realRevenue: 0, patients: [] },
      'Minet Kenya': { count: 0, realRevenue: 0, patients: [] },
      'Corporate / Employer Scheme': { count: 0, realRevenue: 0, patients: [] },
      'Other Private Insurance': { count: 0, realRevenue: 0, patients: [] }
    };

    let totalInsured = 0;
    let totalCash = 0;
    let totalInsuredRevenue = 0;
    let totalCashRevenue = 0;

    // Build patient specific revenue maps
    const patLabMap: Record<string, number> = {};
    periodLabTests.forEach(t => {
      if (t.patientId) {
        patLabMap[t.patientId] = (patLabMap[t.patientId] || 0) + (Number(t.fee) || 0);
      }
    });

    const patDispenseMap: Record<string, number> = {};
    periodDispenses.forEach(d => {
      if (d.patientId) {
        patDispenseMap[d.patientId] = (patDispenseMap[d.patientId] || 0) + (Number(d.totalCost) || 0);
      }
    });

    const patApptMap: Record<string, number> = {};
    periodPaidAppts.forEach(a => {
      if (a.patientId) {
        patApptMap[a.patientId] = (patApptMap[a.patientId] || 0) + (Number(a.billingAmount) || 0);
      }
    });

    periodPatients.forEach(p => {
      const pRev = (patApptMap[p.id] || 0) + (patLabMap[p.id] || 0) + (patDispenseMap[p.id] || 0);

      if (p.paymentMode === 'Insurance') {
        totalInsured++;
        totalInsuredRevenue += pRev;
        const company = p.insuranceCompany || 'NHIF / SHA';
        if (!map[company]) {
          map[company] = { count: 0, realRevenue: 0, patients: [] };
        }
        map[company].count += 1;
        map[company].realRevenue += pRev;
        map[company].patients.push(p);
      } else {
        totalCash++;
        totalCashRevenue += pRev;
      }
    });

    // Also account for direct appointment entries with insurance
    periodPaidAppts.forEach(a => {
      const matched = periodPatients.find(p => p.id === a.patientId);
      if (!matched) {
        const amt = Number(a.billingAmount) || 0;
        if (a.paymentMode === 'Insurance') {
          totalInsuredRevenue += amt;
          const company = a.insuranceCompany || 'NHIF / SHA';
          if (!map[company]) {
            map[company] = { count: 0, realRevenue: 0, patients: [] };
          }
          map[company].realRevenue += amt;
        } else {
          totalCashRevenue += amt;
        }
      }
    });

    const list: Array<{ company: string; count: number; realRevenue: number; patients: Patient[] }> = Object.entries(map).map(([company, data]) => ({
      company,
      count: data.count,
      realRevenue: data.realRevenue,
      patients: data.patients
    }));

    return {
      map,
      list,
      totalInsured,
      totalCash,
      totalInsuredRevenue,
      totalCashRevenue,
      totalPatients: periodPatients.length,
      insuredPct: periodPatients.length > 0 ? Math.round((totalInsured / periodPatients.length) * 100) : 0,
      cashPct: periodPatients.length > 0 ? Math.round((totalCash / periodPatients.length) * 100) : 0
    };
  }, [periodPatients, periodPaidAppts, periodLabTests, periodDispenses]);

  // F. Financials & Revenue Totals
  const totalGrossRevenue = useMemo(() => {
    return consultationRevenue + labRevenue + pharmacyRevenue;
  }, [consultationRevenue, labRevenue, pharmacyRevenue]);

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [periodExpenses]);

  const netSurplus = useMemo(() => {
    return totalGrossRevenue - totalExpenses;
  }, [totalGrossRevenue, totalExpenses]);

  // Handle Add Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid expense amount in Ksh.');
      return;
    }
    if (!expenseDesc.trim()) {
      alert('Please provide a brief description of the expense.');
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      category: expenseCategory,
      amount: amt,
      date: expenseDate || new Date().toISOString().split('T')[0],
      description: expenseDesc.trim(),
      recordedBy: expenseRecordedBy || userName || 'Overall Supervisor',
      recordedAt: new Date().toISOString()
    };

    onAddExpense(newExpense);
    setShowAddExpenseModal(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setToastMessage(`Expense of Ksh ${amt.toLocaleString()} recorded successfully.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Period Display Label
  const periodLabelText = useMemo(() => {
    if (periodMode === 'today') {
      try {
        const d = new Date(selectedDate);
        return `Daily Report: ${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
      } catch {
        return `Daily Report: ${selectedDate}`;
      }
    }
    if (periodMode === 'month') {
      try {
        const [y, m] = selectedMonth.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        return `Monthly Report: ${dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
      } catch {
        return `Monthly Report: ${selectedMonth}`;
      }
    }
    if (periodMode === 'year') {
      return `Annual Report: Fiscal Year ${selectedYear}`;
    }
    return `Period: ${selectedDate}`;
  }, [periodMode, selectedDate, selectedMonth, selectedYear]);

  // PDF Report Generator for Supervisor (Senior-friendly, official letterhead)
  const handleDownloadPDF = (reportType: 'daily' | 'monthly' | 'yearly') => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Official Header Bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PCEA TUMUTUMU HOSPITAL - KARATINA SATELLITE BRANCH', 14, 12);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text('EXECUTIVE OPERATIONS & SUPERVISORY FACILITY REPORT', 14, 18);
      doc.text(`Document Reference: PCEA-KRT-SUP-${Date.now().toString().slice(-6)} • Issued for Executive Board & Supervision`, 14, 23);

      // Period Title Banner
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(14, 32, 182, 14, 2, 2, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);

      let titlePeriod = '';
      if (reportType === 'daily') titlePeriod = `DAILY PERFORMANCE REPORT (${selectedDate})`;
      else if (reportType === 'monthly') titlePeriod = `MONTHLY PERFORMANCE AUDIT (${selectedMonth})`;
      else titlePeriod = `ANNUAL OPERATIONS AUDIT (YEAR ${selectedYear})`;

      doc.text(titlePeriod, 20, 41);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} by ${userName || 'Overall Supervisor'}`, 120, 41);

      let currentY = 52;

      // 1. Executive Summary Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. EXECUTIVE FACILITY KEY PERFORMANCE INDICATORS', 14, currentY);
      currentY += 4;

      const summaryTableData = [
        ['Total Patients Attended', `${periodPatients.length} Patients`, 'Total Gross Hospital Revenue', `Ksh ${totalGrossRevenue.toLocaleString()}`],
        ['General Consultation (OPD)', `${genConsultationPatients.length} Patients`, 'Operating Expenses Incurred', `Ksh ${totalExpenses.toLocaleString()}`],
        ['Specialist / Consultant Clinics', `${specialistPatients.length} Patients`, 'Net Hospital Operating Surplus', `Ksh ${netSurplus.toLocaleString()}`],
        ['Insured Patients vs Cash Payers', `${insuranceBreakdown.totalInsured} Insured / ${insuranceBreakdown.totalCash} Cash`, 'Laboratory Diagnostics Tests', `${periodLabTests.length} Tests (Ksh ${labRevenue.toLocaleString()})`],
        ['Pharmacy Prescriptions Dispensed', `${periodDispenses.length} Dispatches (Ksh ${pharmacyRevenue.toLocaleString()})`, 'Stock Status & Low Inventory Alerts', `${stock.length} Catalog Items (${lowStockCount} Low)`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Metric Description', 'Recorded Count', 'Financial / Operational Parameter', 'Value (Ksh / Count)']],
        body: summaryTableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 2. Departmental Clinics & Specialist Breakdown
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. CLINICAL DEPARTMENTS & SPECIALIST CLINICS BREAKDOWN', 14, currentY);
      currentY += 4;

      const deptRows = [
        ['General Outpatient Consultation (OPD)', `${genConsultationPatients.length} Patients`, `${periodPatients.length > 0 ? Math.round((genConsultationPatients.length / periodPatients.length) * 100) : 0}%`, `Ksh ${genOpdRevenue.toLocaleString()}`, 'General Clinical Officers'],
        ['Specialist: Surgical Clinic', `${surgicalCount} Patients`, `${periodPatients.length > 0 ? Math.round((surgicalCount / periodPatients.length) * 100) : 0}%`, `Ksh ${surgicalRevenue.toLocaleString()}`, 'Consultant Surgeon'],
        ['Specialist: Pediatrics Clinic', `${pediatricsCount} Patients`, `${periodPatients.length > 0 ? Math.round((pediatricsCount / periodPatients.length) * 100) : 0}%`, `Ksh ${pediatricsRevenue.toLocaleString()}`, 'Consultant Pediatrician'],
        ['Specialist: Medical Outpatient (MOPC)', `${mopcCount} Patients`, `${periodPatients.length > 0 ? Math.round((mopcCount / periodPatients.length) * 100) : 0}%`, `Ksh ${mopcRevenue.toLocaleString()}`, 'Consultant Physician'],
        ['Specialist: Obstetrics & Gynecology (Obs/Gyn)', `${obsGynCount} Patients`, `${periodPatients.length > 0 ? Math.round((obsGynCount / periodPatients.length) * 100) : 0}%`, `Ksh ${obsGynRevenue.toLocaleString()}`, 'Consultant Gynecologist'],
        ['Outpatient Procedures / Walk-ins', `${walkInProcedurePatients.length} Patients`, `${periodPatients.length > 0 ? Math.round((walkInProcedurePatients.length / periodPatients.length) * 100) : 0}%`, `Ksh ${walkInProcedureRevenue.toLocaleString()}`, 'Nursing & Procedure Room']
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Department / Specialty Clinic', 'Patient Volume', 'Share (%)', 'Recorded Billings (Ksh)', 'Assigned Personnel']],
        body: deptRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Check for page break
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // 3. Insurance Providers Breakdown
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('3. HEALTH INSURANCE & COVERAGE DISTRIBUTION', 14, currentY);
      currentY += 4;

      const insuranceRows: string[][] = [];
      insuranceBreakdown.list.forEach((data) => {
        if (data.count > 0 || data.realRevenue > 0) {
          const pct = periodPatients.length > 0 ? Math.round((data.count / periodPatients.length) * 100) : 0;
          insuranceRows.push([
            data.company,
            `${data.count} Patients`,
            `${pct}%`,
            `Ksh ${data.realRevenue.toLocaleString()}`,
            'Active Insurance Scheme'
          ]);
        }
      });

      // Add Cash row
      insuranceRows.push([
        'Cash / Direct Payment (Self-Pay)',
        `${insuranceBreakdown.totalCash} Patients`,
        `${insuranceBreakdown.cashPct}%`,
        `Ksh ${insuranceBreakdown.totalCashRevenue.toLocaleString()}`,
        'Direct Hospital Cash / M-PESA'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Insurance Provider / Payment Mode', 'Patients Covered', 'Volume Share (%)', 'Recorded Billings / Claims (Ksh)', 'Settlement Category']],
        body: insuranceRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Check for page break before expenses
      if (currentY > 210) {
        doc.addPage();
        currentY = 20;
      }

      // 4. Operating Expenses Ledger
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('4. OPERATING EXPENSES & FINANCIAL LEDGER', 14, currentY);
      currentY += 4;

      const expenseTableRows = periodExpenses.map(e => [
        e.date || 'N/A',
        e.category || 'General Expense',
        e.description || 'Facility Operational Expenditure',
        e.recordedBy || 'Supervisor',
        `Ksh ${Number(e.amount || 0).toLocaleString()}`
      ]);

      if (expenseTableRows.length === 0) {
        expenseTableRows.push(['N/A', 'No expenses recorded in this period', '-', '-', 'Ksh 0']);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Expense Category', 'Description / Purpose', 'Authorized By', 'Amount (Ksh)']],
        body: expenseTableRows,
        theme: 'striped',
        headStyles: { fillColor: [190, 24, 93], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;

      // Check for page break before signoff
      if (currentY > 245) {
        doc.addPage();
        currentY = 25;
      }

      // Sign-off Block
      doc.setDrawColor(203, 213, 225);
      doc.line(14, currentY, 196, currentY);
      currentY += 8;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SUPERVISOR VERIFICATION & OFFICIAL ENDORSEMENT:', 14, currentY);

      currentY += 12;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Overall Facility Supervisor: ___________________________', 14, currentY);
      doc.text('Signature & Stamp: ___________________________', 120, currentY);

      doc.save(`PCEA_Tumutumu_${reportType.toUpperCase()}_Supervisory_Report_${Date.now()}.pdf`);
      setToastMessage(`${reportType.toUpperCase()} PDF Report downloaded successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('PDF generation error', err);
      alert('Could not generate PDF report. Please check console.');
    }
  };

  // CSV / Excel Export for Supervisor
  const handleDownloadCSV = (reportType: 'daily' | 'monthly' | 'yearly') => {
    try {
      const headers = ['Report Category', 'Metric Name', 'Count / Quantity', 'Financial Value (Ksh)', 'Notes'];
      const rows: string[][] = [
        ['Executive Summary', 'Total Patients Attended', String(periodPatients.length), `Ksh ${totalGrossRevenue}`, 'Total facility OPD patient volume'],
        ['Executive Summary', 'General Consultation (OPD)', String(genConsultationPatients.length), `Ksh ${genOpdRevenue}`, 'General OPD Recorded Billings'],
        ['Executive Summary', 'Specialist Clinics Total', String(specialistPatients.length), `Ksh ${surgicalRevenue + pediatricsRevenue + mopcRevenue + obsGynRevenue}`, 'Surgical, Peds, MOPC, ObsGyn Recorded Billings'],
        ['Executive Summary', 'Surgical Clinic Patients', String(surgicalCount), `Ksh ${surgicalRevenue}`, 'Surgery Outpatient Recorded Billings'],
        ['Executive Summary', 'Pediatrics Clinic Patients', String(pediatricsCount), `Ksh ${pediatricsRevenue}`, 'Child Health Recorded Billings'],
        ['Executive Summary', 'Medical Outpatient (MOPC)', String(mopcCount), `Ksh ${mopcRevenue}`, 'Internal Medicine / MOPC Recorded Billings'],
        ['Executive Summary', 'Obs/Gyn Clinic Patients', String(obsGynCount), `Ksh ${obsGynRevenue}`, 'Maternity & Gynecology Recorded Billings'],
        ['Executive Summary', 'Total Insured Patients', String(insuranceBreakdown.totalInsured), `Ksh ${insuranceBreakdown.totalInsuredRevenue}`, `${insuranceBreakdown.insuredPct}% of total volume`],
        ['Executive Summary', 'Total Cash Patients', String(insuranceBreakdown.totalCash), `Ksh ${insuranceBreakdown.totalCashRevenue}`, `${insuranceBreakdown.cashPct}% of total volume`],
        ['Executive Summary', 'Diagnostics Lab Tests', String(periodLabTests.length), `Ksh ${labRevenue}`, 'Laboratory tests fulfilled'],
        ['Executive Summary', 'Pharmacy Dispenses', String(periodDispenses.length), `Ksh ${pharmacyRevenue}`, 'Medications issued'],
        ['Executive Summary', 'Total Operating Expenses', String(periodExpenses.length), `Ksh ${totalExpenses}`, 'Operational expenditures'],
        ['Executive Summary', 'Net Hospital Surplus', '-', `Ksh ${netSurplus}`, 'Revenue minus Operating Expenses']
      ];

      // Add Insurance Companies
      insuranceBreakdown.list.forEach((d) => {
        if (d.count > 0 || d.realRevenue > 0) {
          rows.push(['Insurance Breakdown', d.company, String(d.count), `Ksh ${d.realRevenue}`, `${periodPatients.length > 0 ? Math.round((d.count / periodPatients.length) * 100) : 0}% volume`]);
        }
      });

      // Add Expenses
      periodExpenses.forEach(e => {
        rows.push(['Expense Ledger', `${e.date} - ${e.category}`, '1', String(e.amount), `${e.description} (Recorded by: ${e.recordedBy})`]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + 
        [headers.join(','), ...rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PCEA_Tumutumu_${reportType.toUpperCase()}_Supervisory_Data_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage(`${reportType.toUpperCase()} Excel/CSV export downloaded.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('CSV export error', err);
      alert('Could not generate CSV file.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. DIGNIFIED EXECUTIVE HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                🏢 Executive Supervisor Desk
              </span>
              <span className="text-xs text-stone-600 font-medium">
                PCEA Tumutumu Karatina Satellite Branch
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight mt-1">
              Overall Facility Operations & Performance
            </h1>
            <p className="text-xs text-stone-700 mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Welcome, <strong className="text-stone-800">{userName || 'Director / Overall Supervisor'}</strong> • Facility running smoothly
            </p>
          </div>
        </div>

        {/* Quick Action: Add Expense Button */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-add-expense-modal"
            onClick={() => setShowAddExpenseModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Record Hospital Expense
          </button>

          <button
            onClick={() => handleDownloadPDF(periodMode === 'today' ? 'daily' : periodMode === 'month' ? 'monthly' : 'yearly')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Download PDF Report"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* 2. SENIOR-FRIENDLY PERIOD SELECTOR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-700 mr-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Select Report Period:
            </span>

            <button
              id="btn-period-today"
              onClick={() => setPeriodMode('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodMode === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              📅 Today (Daily Report)
            </button>

            <button
              id="btn-period-month"
              onClick={() => setPeriodMode('month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodMode === 'month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              🗓️ This Month (Monthly)
            </button>

            <button
              id="btn-period-year"
              onClick={() => setPeriodMode('year')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodMode === 'year'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              📊 This Year (Annual)
            </button>
          </div>

          {/* Date Picker inputs depending on mode */}
          <div className="flex items-center gap-2 self-end lg:self-auto bg-stone-50 p-1.5 rounded-xl border border-stone-200">
            {periodMode === 'today' && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-stone-500">Pick Day:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {periodMode === 'month' && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-stone-500">Pick Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {periodMode === 'year' && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-stone-500">Pick Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Selected Period Confirmation Strip */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="font-bold text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Currently Viewing: <strong>{periodLabelText}</strong></span>
          </div>
          <span className="text-stone-500 font-mono text-[11px]">
            {periodPatients.length} Patients Recorded in this Interval
          </span>
        </div>
      </div>

      {/* 3. EXECUTIVE HIGH-IMPACT HEADLINE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Patients Seen</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-stone-900">{periodPatients.length}</span>
            <span className="text-xs text-stone-500 ml-1.5">patients</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-blue-700 font-semibold">{genConsultationPatients.length} General OPD</span>
            <span className="text-indigo-700 font-semibold">{specialistPatients.length} Specialist</span>
          </div>
        </div>

        {/* General Consultation OPD */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">General Consultation (OPD)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-700">{genConsultationPatients.length}</span>
            <span className="text-xs text-stone-500 ml-1.5">
              ({periodPatients.length > 0 ? Math.round((genConsultationPatients.length / periodPatients.length) * 100) : 0}% of visits)
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-stone-100 text-xs text-stone-500">
            Recorded OPD Revenue: <strong className="text-stone-800">Ksh {genOpdRevenue.toLocaleString()}</strong>
          </div>
        </div>

        {/* Specialist Clinics Total */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Specialist Clinics</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-purple-700">{specialistPatients.length}</span>
            <span className="text-xs text-stone-500 ml-1.5">specialist patients</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-purple-900 font-medium">
            <span>Surgical: {surgicalCount}</span>
            <span>Peds: {pediatricsCount}</span>
            <span>MOPC: {mopcCount}</span>
            <span>Obs/Gyn: {obsGynCount}</span>
          </div>
        </div>

        {/* Insurance Coverage Split */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Payment Coverage</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{insuranceBreakdown.totalInsured} Insured</span>
            <span className="text-xs text-stone-400 font-bold">vs</span>
            <span className="text-xl font-bold text-amber-700">{insuranceBreakdown.totalCash} Cash</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-indigo-700 font-semibold">{insuranceBreakdown.insuredPct}% Insurance</span>
            <span className="text-amber-700 font-semibold">{insuranceBreakdown.cashPct}% Cash Direct</span>
          </div>
        </div>

        {/* Laboratory & Pharmacy Activities */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Lab & Pharmacy Units</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-black text-teal-700">{periodLabTests.length}</span>
              <span className="text-[11px] text-stone-500 ml-1">Lab Tests</span>
            </div>
            <div className="border-l border-stone-200 pl-3">
              <span className="text-2xl font-black text-rose-700">{periodDispenses.length}</span>
              <span className="text-[11px] text-stone-500 ml-1">Rx Dispenses</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Lab Rev: <strong>Ksh {labRevenue.toLocaleString()}</strong></span>
            <span>Pharma Rev: <strong>Ksh {pharmacyRevenue.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Financial Treasury Balance */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Facility Balance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl md:text-3xl font-black ${netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Ksh {netSurplus.toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">Gross: Ksh {totalGrossRevenue.toLocaleString()}</span>
            <span className="text-rose-300">Exp: Ksh {totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 4. WORKSPACE NAVIGATION TABS (OVERVIEW, DEPARTMENTS, INSURANCE, EXPENSES, DOWNLOADS) */}
      <div className="border-b border-stone-200 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSection === 'overview'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Overall Facility Dashboard
        </button>

        <button
          onClick={() => setActiveSection('departments')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSection === 'departments'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Clinical & Specialist Departments
        </button>

        <button
          onClick={() => setActiveSection('insurance')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSection === 'insurance'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Insurance Breakdown ({insuranceBreakdown.totalInsured} Insured)
        </button>

        <button
          onClick={() => setActiveSection('expenses')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSection === 'expenses'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-600" />
          Hospital Expenses Ledger ({periodExpenses.length})
        </button>

        <button
          onClick={() => setActiveSection('reports')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSection === 'reports'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          Download Official Reports
        </button>
      </div>

      {/* 5. TAB CONTENTS */}
      {/* TAB A: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary Narrative Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Executive Supervisor Briefing ({periodLabelText})
            </h3>
            <p className="text-xs text-emerald-900 leading-relaxed mt-2">
              During this reporting window, Karatina Satellite attended to a total of <strong>{periodPatients.length} patients</strong>. 
              Out of these, <strong>{genConsultationPatients.length} visited General Outpatient (OPD)</strong> and <strong>{specialistPatients.length} attended Specialist Clinics</strong> (Surgical: {surgicalCount}, Pediatrics: {pediatricsCount}, MOPC: {mopcCount}, Obs/Gyn: {obsGynCount}).
              <strong> {insuranceBreakdown.totalInsured} patients ({insuranceBreakdown.insuredPct}%)</strong> utilized Health Insurance schemes while <strong>{insuranceBreakdown.totalCash} ({insuranceBreakdown.cashPct}%)</strong> paid Cash.
              Laboratory completed <strong>{periodLabTests.length} tests</strong> and Pharmacy dispensed <strong>{periodDispenses.length} medication orders</strong>.
              Total Collections stand at <strong>Ksh {totalGrossRevenue.toLocaleString()}</strong> against <strong>Ksh {totalExpenses.toLocaleString()}</strong> in approved operating expenses, yielding a net operating balance of <strong>Ksh {netSurplus.toLocaleString()}</strong>.
            </p>
          </div>

          {/* Quick 2-Column Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Department Distribution Visual Progress */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Patient Volume by Clinical Unit
                </h3>
                <span className="text-xs text-stone-500 font-semibold">{periodPatients.length} Total</span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {/* General OPD */}
                <div>
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>General Consultation (OPD)</span>
                    <span className="font-bold text-blue-700">{genConsultationPatients.length} Patients ({periodPatients.length > 0 ? Math.round((genConsultationPatients.length / periodPatients.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${periodPatients.length > 0 ? (genConsultationPatients.length / periodPatients.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Surgical */}
                <div>
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>Surgical Specialist Clinic</span>
                    <span className="font-bold text-purple-700">{surgicalCount} Patients ({periodPatients.length > 0 ? Math.round((surgicalCount / periodPatients.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${periodPatients.length > 0 ? (surgicalCount / periodPatients.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Pediatrics */}
                <div>
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>Pediatrics Specialist Clinic</span>
                    <span className="font-bold text-amber-700">{pediatricsCount} Patients ({periodPatients.length > 0 ? Math.round((pediatricsCount / periodPatients.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${periodPatients.length > 0 ? (pediatricsCount / periodPatients.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* MOPC */}
                <div>
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>Medical Outpatient (MOPC)</span>
                    <span className="font-bold text-teal-700">{mopcCount} Patients ({periodPatients.length > 0 ? Math.round((mopcCount / periodPatients.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-600 h-full rounded-full transition-all"
                      style={{ width: `${periodPatients.length > 0 ? (mopcCount / periodPatients.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Obs/Gyn */}
                <div>
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>Obstetrics & Gynecology (Obs/Gyn)</span>
                    <span className="font-bold text-rose-700">{obsGynCount} Patients ({periodPatients.length > 0 ? Math.round((obsGynCount / periodPatients.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${periodPatients.length > 0 ? (obsGynCount / periodPatients.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Top Insurance Providers Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Primary Insurance Schemes
                </h3>
                <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {insuranceBreakdown.totalInsured} Insured Patients
                </span>
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                {insuranceBreakdown.list
                  .filter((d) => d.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.company} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="font-semibold text-stone-800">{d.company}</span>
                      <div className="text-right">
                        <strong className="text-indigo-900 font-bold">{d.count} patients</strong>
                        <span className="text-[10px] text-stone-500 block">
                          {periodPatients.length > 0 ? Math.round((d.count / periodPatients.length) * 100) : 0}% share
                        </span>
                      </div>
                    </div>
                  ))}

                {insuranceBreakdown.totalInsured === 0 && (
                  <div className="p-4 text-center text-stone-400 italic">
                    No insurance records logged in this specific period.
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 mt-3">
                  <span className="font-semibold text-amber-900">Direct Cash Payers</span>
                  <div className="text-right">
                    <strong className="text-amber-950 font-bold">{insuranceBreakdown.totalCash} patients</strong>
                    <span className="text-[10px] text-amber-700 block">{insuranceBreakdown.cashPct}% share</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: CLINICAL & SPECIALIST DEPARTMENTS */}
      {activeSection === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Departmental Consultation & Specialist Breakdown
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Review patient headcounts, percentage volume share, and estimated revenue generated across all medical divisions for {periodLabelText}.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50">
                    <th className="p-3">Department / Clinic</th>
                    <th className="p-3">Patients Handled</th>
                    <th className="p-3">Volume Share</th>
                    <th className="p-3">Paid Appointments / Records</th>
                    <th className="p-3">Total Recorded Revenue</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  <tr>
                    <td className="p-3 font-bold text-blue-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      🏥 General Outpatient Consultation (OPD)
                    </td>
                    <td className="p-3 font-bold text-stone-900">{genConsultationPatients.length}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((genConsultationPatients.length / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.category === 'General Consultation' || (!a.category && !a.consultantSubCategory)).length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {genOpdRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active OPD</span></td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-purple-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      🔪 Specialist: Surgical Clinic
                    </td>
                    <td className="p-3 font-bold text-stone-900">{surgicalCount}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((surgicalCount / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.consultantSubCategory === 'Surgical' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('surg'))).length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {surgicalRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Specialist</span></td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      👶 Specialist: Pediatrics Clinic
                    </td>
                    <td className="p-3 font-bold text-stone-900">{pediatricsCount}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((pediatricsCount / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.consultantSubCategory === 'Pediatrics' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('ped'))).length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {pediatricsRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Specialist</span></td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-teal-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      🩺 Specialist: Medical Outpatient (MOPC)
                    </td>
                    <td className="p-3 font-bold text-stone-900">{mopcCount}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((mopcCount / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.consultantSubCategory === 'MOPC' || (a.category === 'Consultant Clinic' && (a.notes || '').toLowerCase().includes('mopc'))).length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {mopcRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Specialist</span></td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-rose-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      🤰 Specialist: Obstetrics & Gynecology (Obs/Gyn)
                    </td>
                    <td className="p-3 font-bold text-stone-900">{obsGynCount}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((obsGynCount / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.consultantSubCategory === 'Obs/Gyn' || (a.category === 'Consultant Clinic' && ((a.notes || '').toLowerCase().includes('gyn') || (a.notes || '').toLowerCase().includes('obs')))).length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {obsGynRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Specialist</span></td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-stone-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                      🩹 Outpatient Procedures & Walk-in Services
                    </td>
                    <td className="p-3 font-bold text-stone-900">{walkInProcedurePatients.length}</td>
                    <td className="p-3">{periodPatients.length > 0 ? Math.round((walkInProcedurePatients.length / periodPatients.length) * 100) : 0}%</td>
                    <td className="p-3 font-mono">{periodPaidAppts.filter(a => a.category === 'Outpatient Procedure' || a.category === 'Walk-in Lab' || a.category === 'Walk-in Pharmacy').length} records</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Ksh {walkInProcedureRevenue.toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-bold">Procedures</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Lab & Pharmacy Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lab Diagnostics */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-teal-600" />
                  Laboratory Diagnostics Activity
                </h3>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  Ksh {labRevenue.toLocaleString()} Revenue
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <span className="text-stone-500 block mb-1">Total Lab Tests Carried Out:</span>
                <span className="text-2xl font-black text-teal-700">{periodLabTests.length} tests</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Most Requested Diagnostic Tests:
                </span>
                {popularLabTests.map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center text-xs p-2 bg-stone-50 rounded-lg">
                    <span className="font-semibold text-stone-800">{name}</span>
                    <span className="font-mono font-bold text-teal-700">{count} times</span>
                  </div>
                ))}
                {popularLabTests.length === 0 && (
                  <p className="text-stone-400 text-xs italic">No laboratory tests conducted in this period.</p>
                )}
              </div>
            </div>

            {/* Pharmacy Dispatches */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-rose-600" />
                  Pharmacy Prescriptions & Stock Health
                </h3>
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  Ksh {pharmacyRevenue.toLocaleString()} Revenue
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                <div>
                  <span className="text-stone-500 block mb-0.5">Dispensed Rx Orders:</span>
                  <span className="text-2xl font-black text-rose-700">{periodDispenses.length} items</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block mb-0.5">Low Stock Warning:</span>
                  <span className={`text-lg font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {lowStockCount} items low
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Hospital dispensary is actively monitored. <strong>{stock.length} medication items</strong> currently registered in the inventory catalog.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: INSURANCE BREAKDOWN (DETAILED) */}
      {activeSection === 'insurance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Health Insurance Scheme Utilization Breakdown
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Itemized list of all patients who received care under insurance schemes vs. cash basis in {periodLabelText}.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 font-bold border border-indigo-200">
                  🛡️ {insuranceBreakdown.totalInsured} Insured ({insuranceBreakdown.insuredPct}%)
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-bold border border-amber-200">
                  💵 {insuranceBreakdown.totalCash} Cash ({insuranceBreakdown.cashPct}%)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50">
                    <th className="p-3">Insurance Company / Provider</th>
                    <th className="p-3">Patients Count</th>
                    <th className="p-3">Volume Share</th>
                    <th className="p-3">Recorded Billings / Claims (Ksh)</th>
                    <th className="p-3">Billing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  {insuranceBreakdown.list.map((d) => (
                    <tr key={d.company} className={d.count > 0 || d.realRevenue > 0 ? 'bg-indigo-50/20' : ''}>
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <Shield className={`w-3.5 h-3.5 ${d.count > 0 ? 'text-indigo-600' : 'text-stone-400'}`} />
                        {d.company}
                      </td>
                      <td className="p-3 font-bold text-indigo-950">{d.count}</td>
                      <td className="p-3">
                        {periodPatients.length > 0 ? Math.round((d.count / periodPatients.length) * 100) : 0}%
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-800">
                        Ksh {d.realRevenue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        {d.count > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active Claims ({d.count})
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">0 Claims</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Cash Row */}
                  <tr className="bg-amber-50/30">
                    <td className="p-3 font-bold text-amber-950 flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      Direct Cash Payments (Self-Pay)
                    </td>
                    <td className="p-3 font-bold text-amber-950">{insuranceBreakdown.totalCash}</td>
                    <td className="p-3 font-bold">{insuranceBreakdown.cashPct}%</td>
                    <td className="p-3 font-mono font-bold text-amber-800">
                      Ksh {insuranceBreakdown.totalCashRevenue.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Cash Settled
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: HOSPITAL EXPENSES LEDGER & MANAGEMENT */}
      {activeSection === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  Facility Operating Expenses Ledger
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Track hospital expenditures, utilities, staff wages, drugs restock, and administrative payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-right">
                  <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Period Expenses</span>
                  <span className="text-base font-black text-rose-800">Ksh {totalExpenses.toLocaleString()}</span>
                </div>

                <button
                  id="btn-add-expense-tab"
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Record Expense
                </button>
              </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50">
                    <th className="p-3">Expense Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description / Payee</th>
                    <th className="p-3">Recorded By</th>
                    <th className="p-3 text-right">Amount (Ksh)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  {periodExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-stone-50/60">
                      <td className="p-3 font-mono text-stone-600">{exp.date}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-stone-900">{exp.description}</td>
                      <td className="p-3 text-stone-500">{exp.recordedBy}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                        Ksh {Number(exp.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove expense: "${exp.description}" (Ksh ${exp.amount.toLocaleString()})?`)) {
                              onRemoveExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete / Void Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {periodExpenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                        No expenses logged for {periodLabelText}. Click "+ Record Hospital Expense" above to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB E: DOWNLOAD OFFICIAL REPORTS (DAILY, MONTHLY, YEARLY) */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Executive Periodic Reports & Exports
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Download clean, ink-safe official documents formatted for the Executive Board, Superintendent, and Audit Officers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Report Card */}
              <div className="p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">Daily Operations Report</h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    End-of-day summary of today's patient visits, departmental consultations, insurance logs, and daily expenses.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleDownloadPDF('daily')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Daily PDF
                  </button>
                  <button
                    onClick={() => handleDownloadCSV('daily')}
                    className="w-full bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Daily Excel
                  </button>
                </div>
              </div>

              {/* Monthly Report Card */}
              <div className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-blue-950">Monthly Facility Audit</h4>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Comprehensive month-end financial and clinical audit detailing revenue streams, expenses, and provider distributions.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleDownloadPDF('monthly')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Monthly PDF
                  </button>
                  <button
                    onClick={() => handleDownloadCSV('monthly')}
                    className="w-full bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Monthly Excel
                  </button>
                </div>
              </div>

              {/* Yearly Report Card */}
              <div className="p-6 rounded-2xl border-2 border-purple-200 bg-purple-50/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-purple-950">Annual Executive Performance</h4>
                  <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                    Fiscal year-end hospital performance review summarizing total patient volume, annual treasury, and annual expense records.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleDownloadPDF('yearly')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Annual PDF
                  </button>
                  <button
                    onClick={() => handleDownloadCSV('yearly')}
                    className="w-full bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" /> Export Annual Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW HOSPITAL EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Hospital Expense</h3>
                  <p className="text-xs text-slate-300">Authorize operational hospital expenditure</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Expense Category
                </label>
                <select
                  id="select-expense-category"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="Medical Supplies & Drugs">💊 Medical Supplies & Drugs Restock</option>
                  <option value="Staff Wages & Locum">👥 Staff Wages, Allowances & Locum</option>
                  <option value="Electricity & Power Utility">💡 Electricity & Power Utility</option>
                  <option value="Water Utility & Sanitation">💧 Water Utility & Sanitation</option>
                  <option value="Facility Maintenance & Repairs">🛠️ Facility Maintenance & Repairs</option>
                  <option value="Facility Rent & Premises">🏢 Facility Rent & Premises</option>
                  <option value="Cleaning & Waste Disposal">🧹 Cleaning, Laundry & Waste Disposal</option>
                  <option value="Fuel & Ambulance Transport">⛽ Vehicle Fuel & Ambulance Transport</option>
                  <option value="Security Services">🛡️ Security Services & Guarding</option>
                  <option value="Miscellaneous / Office">📦 Miscellaneous / General Office</option>
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Amount Paid (Ksh) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-stone-400">Ksh</span>
                    <input
                      id="inp-expense-amount"
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 8500"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full pl-12 bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Settlement Date *
                  </label>
                  <input
                    id="inp-expense-date"
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Description / Payee / Purpose *
                </label>
                <textarea
                  id="inp-expense-desc"
                  required
                  rows={3}
                  placeholder="e.g. Purchased 50 units IV Normal Saline and antibiotics restock from KEMSA..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                ></textarea>
              </div>

              {/* Authorized By */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Authorized By
                </label>
                <input
                  type="text"
                  value={expenseRecordedBy}
                  onChange={(e) => setExpenseRecordedBy(e.target.value)}
                  className="w-full bg-stone-100 border border-stone-200 rounded-lg p-2 text-xs text-stone-700"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-expense-submit"
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
