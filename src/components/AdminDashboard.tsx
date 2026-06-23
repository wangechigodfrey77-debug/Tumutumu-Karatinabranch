/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Users, CalendarPlus, CheckSquare, Trash, BarChart3, TrendingUp, Sparkles, Building, Layers, Landmark, Calendar, Plus, X, FileSpreadsheet, History, Download } from 'lucide-react';
import { Patient, LabTest, MedicationDispense, DutyAllocation, LeaveRequest, WhitelistUser, UserRole, Expense, PharmacyItem, AuditLog, Appointment } from '../types';
import { GoogleSheetsView } from './GoogleSheetsView';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdminDashboardProps {
  patients: Patient[];
  labTests: LabTest[];
  appointments: Appointment[];
  dispenses: MedicationDispense[];
  stock: PharmacyItem[];
  duties: DutyAllocation[];
  leaves: LeaveRequest[];
  whitelist: WhitelistUser[];
  expenses: Expense[];
  auditLogs?: AuditLog[];
  onAddWhitelist: (user: WhitelistUser) => void;
  onRemoveWhitelist: (email: string) => void;
  onAddDuty: (duty: DutyAllocation) => void;
  onRemoveDuty: (dutyId: string) => void;
  onUpdateLeaveStatus: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (expenseId: string) => void;
  currentUserEmail: string;
}

export function AdminDashboard({
  patients,
  labTests,
  appointments,
  dispenses,
  stock = [],
  duties,
  leaves,
  whitelist,
  expenses = [],
  auditLogs = [],
  onAddWhitelist,
  onRemoveWhitelist,
  onAddDuty,
  onRemoveDuty,
  onUpdateLeaveStatus,
  onAddExpense,
  onRemoveExpense,
  currentUserEmail,
}: AdminDashboardProps) {
  const [activeAdminSub, setActiveAdminSub] = useState<'rosters' | 'whitelist' | 'leaves' | 'finances' | 'sheets' | 'audit'>('finances');
  const [financePeriodView, setFinancePeriodView] = useState<'monthly' | 'daily'>('monthly');
  const [selectedFinMonth, setSelectedFinMonth] = useState<string>('All');
  const [selectedFinDate, setSelectedFinDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Periodic Audit Reports Filter Selection States
  const [reportTarget, setReportTarget] = useState<'cash' | 'insurance' | 'lab' | 'pharmacy'>('cash');
  const [reportPeriodType, setReportPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily');
  const [reportCustomDate, setReportCustomDate] = useState<string>('2026-06-15');
  const [reportCustomMonth, setReportCustomMonth] = useState<string>('2026-06');
  const [reportCustomYear, setReportCustomYear] = useState<string>('2026');
  const [reportCustomQuarter, setReportCustomQuarter] = useState<string>('2');

  // Gather available months dynamically from appointments, labTests, dispenses, and expenses
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    appointments.forEach(a => {
      if (a.date) months.add(a.date.substring(0, 7));
    });
    labTests.forEach(t => {
      if (t.testDate) months.add(t.testDate.substring(0, 7));
    });
    dispenses.forEach(d => {
      if (d.dispenseDate) months.add(d.dispenseDate.substring(0, 7));
    });
    expenses.forEach(e => {
      if (e.date) months.add(e.date.substring(0, 7));
    });
    return Array.from(months).filter(m => m && m.length === 7).sort();
  }, [appointments, labTests, dispenses, expenses]);

  // Gather available dates dynamically from appointments, labTests, dispenses, and expenses
  const availableDates = React.useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(a => {
      if (a.date) dates.add(a.date.substring(0, 10));
    });
    labTests.forEach(t => {
      if (t.testDate) dates.add(t.testDate.substring(0, 10));
    });
    dispenses.forEach(d => {
      if (d.dispenseDate) dates.add(d.dispenseDate.substring(0, 10));
    });
    expenses.forEach(e => {
      if (e.date) dates.add(e.date.substring(0, 10));
    });
    return Array.from(dates).filter(d => d && d.length === 10).sort().reverse();
  }, [appointments, labTests, dispenses, expenses]);

  // Filtering states for System Audit Logs mutations
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [emailTerm, setEmailTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredLogs = (auditLogs || []).filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmail = log.userEmail.toLowerCase().includes(emailTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesEmail && matchesSeverity;
  });

  // New Whitelist state
  const [wlEmail, setWlEmail] = useState<string>('');
  const [wlName, setWlName] = useState<string>('');
  const [wlRole, setWlRole] = useState<UserRole>('Doctor');

  // New Duty state
  const [dutyEmail, setDutyEmail] = useState<string>('');
  const [dutyShift, setDutyShift] = useState<'Day Shift' | 'Night Shift' | 'On Call'>('Day Shift');
  const [dutyDept, setDutyDept] = useState<'Reception' | 'Lab' | 'Pharmacy' | 'Clinical' | 'Admin'>('Clinical');
  const [dutyDate, setDutyDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // New Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('Electricity');
  const [expenseCustomCategory, setExpenseCustomCategory] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState<string>('');

  // Compute departmental financial statistics
  const filteredAppts = financePeriodView === 'daily'
    ? appointments.filter(a => a.billingStatus === 'Paid' && a.date === selectedFinDate)
    : (selectedFinMonth === 'All'
        ? appointments.filter(a => a.billingStatus === 'Paid')
        : appointments.filter(a => a.billingStatus === 'Paid' && a.date?.startsWith(selectedFinMonth)));

  const filteredLab = financePeriodView === 'daily'
    ? labTests.filter(t => t.testDate === selectedFinDate)
    : (selectedFinMonth === 'All'
        ? labTests
        : labTests.filter(t => t.testDate?.startsWith(selectedFinMonth)));

  const filteredDispenses = financePeriodView === 'daily'
    ? dispenses.filter(d => d.dispenseDate === selectedFinDate)
    : (selectedFinMonth === 'All'
        ? dispenses
        : dispenses.filter(d => d.dispenseDate?.startsWith(selectedFinMonth)));

  const filteredPatientsForCounts = financePeriodView === 'daily'
    ? patients.filter(p => p.registeredAt?.substring(0, 10) === selectedFinDate)
    : (selectedFinMonth === 'All'
        ? patients
        : patients.filter(p => p.registeredAt?.startsWith(selectedFinMonth)));

  // Distinguish Pharma vs Non-Pharma
  const pharmaDispenses = filteredDispenses.filter(d => {
    const matched = stock?.find(s => s.name === d.medicationName);
    if (!matched) return true;
    const cat = matched.category;
    return cat !== 'Non-Pharmaceutical' && cat !== 'Surgicals & Non-Pharmaceuticals';
  });
  const nonPharmaDispenses = filteredDispenses.filter(d => {
    const matched = stock?.find(s => s.name === d.medicationName);
    if (!matched) return false;
    const cat = matched.category;
    return cat === 'Non-Pharmaceutical' || cat === 'Surgicals & Non-Pharmaceuticals';
  });

  const patientRevenue = filteredAppts.reduce((sum, a) => sum + (a.billingAmount || 0), 0);
  const labRevenue = filteredLab.reduce((sum, item) => sum + (item.fee || 0), 0);
  const pharmaRevenue = pharmaDispenses.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const nonPharmaRevenue = nonPharmaDispenses.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  const pharmacyRevenue = pharmaRevenue + nonPharmaRevenue;
  const totalCombinedRevenue = patientRevenue + labRevenue + pharmacyRevenue;

  // General patient split
  const generalPatCount = filteredPatientsForCounts.filter((p) => p.category === 'General Consultation').length;
  const specialistPatCount = filteredPatientsForCounts.filter((p) => p.category === 'Consultant Clinic').length;

  const surgicalCount = filteredPatientsForCounts.filter((p) => p.consultantSubCategory === 'Surgical').length;
  const pediatricsCount = filteredPatientsForCounts.filter((p) => p.consultantSubCategory === 'Pediatrics').length;
  const mopcCount = filteredPatientsForCounts.filter((p) => p.consultantSubCategory === 'MOPC').length;
  const obsGynCount = filteredPatientsForCounts.filter((p) => p.consultantSubCategory === 'Obs/Gyn').length;

  const handleGenerateReportPDF = () => {
    const isWithinPeriod = (rawDate: string | undefined): boolean => {
      if (!rawDate) return false;
      const dateOnlyStr = rawDate.substring(0, 10); // YYYY-MM-DD
      if (reportPeriodType === 'daily') {
        return dateOnlyStr === reportCustomDate;
      }
      if (reportPeriodType === 'weekly') {
        const targetDate = new Date(reportCustomDate);
        const day = targetDate.getDay();
        const diff = targetDate.getDate() - day; // Sunday of the week
        const sunday = new Date(targetDate.setDate(diff));
        sunday.setHours(0,0,0,0);
        const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
        saturday.setHours(23,59,59,999);

        const recordDate = new Date(dateOnlyStr);
        recordDate.setHours(12,0,0,0);
        return recordDate >= sunday && recordDate <= saturday;
      }
      if (reportPeriodType === 'monthly') {
        return dateOnlyStr.startsWith(reportCustomMonth);
      }
      if (reportPeriodType === 'quarterly') {
        const year = dateOnlyStr.substring(0, 4);
        if (year !== reportCustomYear) return false;
        const month = parseInt(dateOnlyStr.substring(5, 7), 10);
        const q = Math.ceil(month / 3);
        return String(q) === reportCustomQuarter;
      }
      if (reportPeriodType === 'yearly') {
        return dateOnlyStr.startsWith(reportCustomYear);
      }
      return false;
    };

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Printer-friendly corporate branding header (ink-safe)
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
    doc.text('OUTPATIENT COMPLIANCE & ADMINISTRATIVE AUDIT LEDGER', 14, 25);
    doc.text(`Generated: ${new Date().toLocaleString()} • Authorized Administrative Records • Confidential`, 14, 31);

    // Default accent/theme colors or line colors
    let targetLabel = '';
    let periodLabel = '';
    let tableHeaders: string[][] = [];
    let tableRows: string[][] = [];
    let metricsSummary = '';
    let pdfThemeColor: [number, number, number] = [16, 185, 129]; // default emerald/green

    if (reportPeriodType === 'daily') {
      periodLabel = `DAILY PERIOD - ${reportCustomDate}`;
    } else if (reportPeriodType === 'weekly') {
      const targetDate = new Date(reportCustomDate);
      const day = targetDate.getDay();
      const diff = targetDate.getDate() - day;
      const sunday = new Date(targetDate.setDate(diff));
      const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
      periodLabel = `WEEKLY PERIOD - ${sunday.toLocaleDateString()} to ${saturday.toLocaleDateString()}`;
    } else if (reportPeriodType === 'monthly') {
      periodLabel = `MONTHLY PERIOD - ${reportCustomMonth}`;
    } else if (reportPeriodType === 'quarterly') {
      periodLabel = `QUARTERLY PERIOD - Q${reportCustomQuarter} of ${reportCustomYear}`;
    } else if (reportPeriodType === 'yearly') {
      periodLabel = `YEARLY PERIOD - FY ${reportCustomYear}`;
    }

    if (reportTarget === 'cash') {
      targetLabel = 'CASH-PAYING OUTPATIENT REGISTRIES';
      pdfThemeColor = [245, 158, 11]; // amber-500
      doc.setDrawColor(245, 158, 11);

      const filtered = patients.filter(p => p.paymentMode === 'Cash' && isWithinPeriod(p.registeredAt));
      tableHeaders = [['Patient ID', 'OP-Number', 'Patient Name', 'Age / Sex', 'Phone', 'Clinic Department', 'Date Registered', 'Registered By']];
      tableRows = filtered.map(p => [
        p.id,
        p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`,
        p.name,
        `${p.age} ${p.ageUnit === 'Months' ? 'Mos' : 'Yrs'} / ${p.gender}`,
        p.phone || 'N/A',
        p.category === 'General Consultation' 
          ? 'General OPD' 
          : p.category === 'Consultant Clinic'
            ? `Consultant (${p.consultantSubCategory || 'N/A'})`
            : p.category,
        p.registeredAt ? p.registeredAt.substring(0, 10) : 'N/A',
        p.registeredBy || 'Receptionist'
      ]);
      metricsSummary = `Total Cash-Paying Patients: ${filtered.length} outpatient registries`;

    } else if (reportTarget === 'insurance') {
      targetLabel = 'HEALTH INSURANCE-COVERED PATIENTS';
      pdfThemeColor = [147, 51, 234]; // purple-600
      doc.setDrawColor(147, 51, 234);

      const filtered = patients.filter(p => p.paymentMode === 'Insurance' && isWithinPeriod(p.registeredAt));
      tableHeaders = [['Patient ID', 'OP-Number', 'Patient Name', 'Age / Sex', 'Insurance Provider', 'Phone', 'Clinic Department', 'Date Registered']];
      tableRows = filtered.map(p => [
        p.id,
        p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`,
        p.name,
        `${p.age} ${p.ageUnit === 'Months' ? 'Mos' : 'Yrs'} / ${p.gender}`,
        p.insuranceCompany || 'N/A',
        p.phone || 'N/A',
        p.category === 'General Consultation' 
          ? 'General OPD' 
          : p.category === 'Consultant Clinic'
            ? `Consultant (${p.consultantSubCategory || 'N/A'})`
            : p.category,
        p.registeredAt ? p.registeredAt.substring(0, 10) : 'N/A'
      ]);
      metricsSummary = `Total Insurance Patients: ${filtered.length} outpatient registries`;

    } else if (reportTarget === 'lab') {
      targetLabel = 'LABORATORY DIAGNOSIS SERVICES';
      pdfThemeColor = [59, 130, 246]; // blue-500
      doc.setDrawColor(59, 130, 246);

      const filtered = labTests.filter(t => isWithinPeriod(t.testDate));
      tableHeaders = [['Test ID', 'Date Performed', 'Patient Name', 'Patient ID', 'Conducted Lab Test', 'Technician', 'Billed Fee']];
      tableRows = filtered.map(t => [
        t.id,
        t.testDate ? t.testDate.substring(0, 10) : 'N/A',
        t.patientName,
        t.patientId,
        t.testName,
        t.performedBy,
        `Ksh ${t.fee.toLocaleString()}`
      ]);
      const totalFee = filtered.reduce((sum, t) => sum + (t.fee || 0), 0);
      metricsSummary = `Total Diagnostic Encounters: ${filtered.length} tests | Total Labs Revenue Billed: Ksh ${totalFee.toLocaleString()}`;

    } else if (reportTarget === 'pharmacy') {
      targetLabel = 'PHARMACY DRUG & PRESCRIPTION DISPENSATIONS';
      pdfThemeColor = [79, 70, 229]; // indigo-600
      doc.setDrawColor(79, 70, 229);

      const filtered = dispenses.filter(d => isWithinPeriod(d.dispenseDate));
      tableHeaders = [['Dispense ID', 'Date Dispensed', 'Patient Name', 'Dispatched Medical Item', 'Qty', 'Unit Price', 'Billed Total', 'Dispensed By']];
      tableRows = filtered.map(d => [
        d.id,
        d.dispenseDate ? d.dispenseDate.substring(0, 10) : 'N/A',
        d.patientName,
        d.medicationName,
        String(d.quantity),
        `Ksh ${d.pricePerUnit}`,
        `Ksh ${d.totalCost.toLocaleString()}`,
        d.dispensedBy
      ]);
      const totalCostVal = filtered.reduce((sum, d) => sum + (d.totalCost || 0), 0);
      const totalQty = filtered.reduce((sum, d) => sum + (d.quantity || 0), 0);
      metricsSummary = `Total Items Filled: ${filtered.length} orders | Total Units Supplied: ${totalQty} units | Cumulative Billing: Ksh ${totalCostVal.toLocaleString()}`;
    }

    doc.line(14, 37, 196, 37); // Draw colored accent line

    // Section title
    doc.setTextColor(15, 23, 42); 
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`AUDIT PARAMETERS: ${targetLabel}`, 14, 48);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Reporting Cohort: ${periodLabel}`, 14, 53);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(pdfThemeColor[0], pdfThemeColor[1], pdfThemeColor[2]);
    doc.text(`${metricsSummary}`, 14, 59);

    // Standard autoTable layout
    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 64,
      theme: 'striped',
      headStyles: { fillColor: pdfThemeColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        ...(reportTarget === 'lab' ? { 6: { halign: 'right', fontStyle: 'bold' } } : {}),
        ...(reportTarget === 'pharmacy' ? { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' } } : {})
      },
      didDrawPage: (data) => {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`PCEA Tumutumu Hospital Satellite Office Audit Record • Page ${data.pageNumber}`, 14, 285);
        doc.text('STRICTLY CONFIDENTIAL - INTERNAL DISTRIBUTION ONLY', 132, 285);
      }
    });

    const filePrefix = reportTarget.toUpperCase();
    const cleanPeriodStr = periodLabel.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`TUMUTUMU_AUDIT_${filePrefix}_${cleanPeriodStr}.pdf`);
  };

  const handleAddWhitelistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail.trim() || !wlName.trim()) return;

    if (whitelist.some((w) => w.email.toLowerCase() === wlEmail.toLowerCase())) {
      alert('Email already logged in the whitelist ledger.');
      return;
    }

    onAddWhitelist({
      email: wlEmail.trim().toLowerCase(),
      name: wlName.trim(),
      role: wlRole,
    });

    setWlEmail('');
    setWlName('');
    alert(`Whitelisted secure login approved for: ${wlName}`);
  };

  const handleAddDutySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyEmail) return;

    const staffMember = whitelist.find((w) => w.email === dutyEmail);
    if (!staffMember) return;

    const newDuty: DutyAllocation = {
      id: `DUTY-${Math.floor(Math.random() * 100000)}`,
      staffEmail: dutyEmail,
      staffName: staffMember.name,
      role: staffMember.role,
      shift: dutyShift,
      department: dutyDept,
      date: dutyDate,
    };

    onAddDuty(newDuty);
    alert(`Shift assigned safely to ${staffMember.name}.`);
  };

  return (
    <div id="admin-module" className="space-y-6">
      {/* Central Admin Navigation */}
      <div className="bg-white border border-stone-200 rounded-xl p-1 flex gap-1 flex-wrap shrink-0">
        <button
          id="btn-admin-finances"
          onClick={() => setActiveAdminSub('finances')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'finances' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Finance & Performance Reports
        </button>
        <button
          id="btn-admin-rosters"
          onClick={() => setActiveAdminSub('rosters')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'rosters' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Shift Duty Allocator
        </button>
        <button
          id="btn-admin-leaves"
          onClick={() => setActiveAdminSub('leaves')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'leaves' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Leaves Process Center ({leaves.filter((l) => l.status === 'Pending').length})
        </button>
        <button
          id="btn-admin-whitelist"
          onClick={() => setActiveAdminSub('whitelist')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'whitelist' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Secure Email Whitelist
        </button>
        <button
          id="btn-admin-sheets"
          onClick={() => setActiveAdminSub('sheets')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'sheets' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Google Sheets Sync
        </button>
        <button
          id="btn-admin-audit"
          onClick={() => setActiveAdminSub('audit')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'audit' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Audit Logs
        </button>
      </div>

      {/* A. CFO FINANCIAL CONTROL & SATELLITE OPERATIONS DESK */}
      {activeAdminSub === 'finances' && (() => {
        // Compute expenses statistics based on selectedFinanceMonth
        const finalExpenses = financePeriodView === 'daily'
          ? expenses.filter(e => e.date === selectedFinDate)
          : (selectedFinMonth === 'All'
              ? expenses
              : expenses.filter(e => e.date?.startsWith(selectedFinMonth)));

        const totalExpenses = finalExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const electricityExpenses = finalExpenses.filter(e => e.category === 'Electricity').reduce((sum, e) => sum + (e.amount || 0), 0);
        const waterExpenses = finalExpenses.filter(e => e.category === 'Water').reduce((sum, e) => sum + (e.amount || 0), 0);
        const securityExpenses = finalExpenses.filter(e => e.category === 'Security').reduce((sum, e) => sum + (e.amount || 0), 0);
        const otherExpenses = finalExpenses.filter(e => !['Electricity', 'Water', 'Security'].includes(e.category)).reduce((sum, e) => sum + (e.amount || 0), 0);

        const netBalance = totalCombinedRevenue - totalExpenses;
        const profitMargin = totalCombinedRevenue > 0 ? (netBalance / totalCombinedRevenue) * 100 : 0;

        // Daily trend data aggregation
        let trendDates: string[];
        if (financePeriodView === 'daily') {
          const baseDate = new Date(selectedFinDate);
          trendDates = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() - i);
            trendDates.push(d.toISOString().split('T')[0]);
          }
        } else {
          const trendPrefix = selectedFinMonth === 'All' ? '2026-06' : selectedFinMonth;
          trendDates = ['01', '02', '03', '04', '05', '06', '07', '08'].map(day => `${trendPrefix}-${day}`);
        }
        const dailyMetrics = trendDates.map(date => {
          // Patient consulting registration revenue from paid appointments on that day
          const patTodayRev = appointments
            .filter(a => a.date === date && a.billingStatus === 'Paid')
            .reduce((sum, a) => sum + (a.billingAmount || 0), 0);

          // Lab tests today revenue
          const labTodayRev = labTests.filter(t => t.testDate === date).reduce((sum, t) => sum + (t.fee || 0), 0);

          // Pharmacy dispenses today revenue
          const pharTodayRev = dispenses.filter(d => d.dispenseDate === date).reduce((sum, d) => sum + (d.totalCost || 0), 0);

          const revenue = patTodayRev + labTodayRev + pharTodayRev;
          const expense = expenses.filter(e => e.date === date).reduce((sum, e) => sum + (e.amount || 0), 0);
          const profit = revenue - expense;

          return { date, revenue, expense, profit };
        });

        // Compute SVG graph points
        // Width: 500, Height: 150 bounds
        const maxVal = Math.max(...dailyMetrics.map(m => Math.max(m.revenue, m.expense, Math.abs(m.profit))), 10000);
        const getX = (index: number) => 40 + (index * 420) / (trendDates.length - 1);
        const getY = (val: number) => 130 - (val / maxVal) * 110; // Reserve padding top and bottom

        const revenuePoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.revenue)}`).join(' ');
        const expensePoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.expense)}`).join(' ');
        const profitPoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.profit)}`).join(' ');

        const handleAddExpenseSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const amountNum = parseFloat(expenseAmount);
          if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid expense amount (> 0).');
            return;
          }

          const finalCategory = expenseCategory === 'Other' ? (expenseCustomCategory.trim() || 'Other') : expenseCategory;

          const newExpense: Expense = {
            id: `EXP-${Math.floor(Math.random() * 100000)}`,
            category: finalCategory,
            amount: amountNum,
            date: expenseDate,
            description: expenseDescription.trim() || `Branch ${finalCategory} Expense disbursement`,
            recordedBy: currentUserEmail || 'admin@tumutumu.org',
            recordedAt: new Date().toISOString()
          };

          onAddExpense(newExpense);
          setShowExpenseModal(false);
          setExpenseAmount('');
          setExpenseDescription('');
          setExpenseCustomCategory('');
        };

        return (
          <div id="admin-finances-submodule" className="space-y-6">
            {/* Elegant Reporting Period Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-stone-50 border border-stone-200 p-4 rounded-xl gap-4">
              <div>
                <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  CFO Financial Statement Period
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Filter global income, lab invoices, opex billing, and treasury ledger stats daily or monthly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                {/* Segmented Period Toggle */}
                <div className="flex items-center bg-stone-200/60 p-1 rounded-lg border border-stone-200">
                  <button
                    id="btn-fin-view-monthly"
                    type="button"
                    onClick={() => setFinancePeriodView('monthly')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      financePeriodView === 'monthly'
                        ? 'bg-white text-stone-800 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Monthly & Cumulative
                  </button>
                  <button
                    id="btn-fin-view-daily"
                    type="button"
                    onClick={() => setFinancePeriodView('daily')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      financePeriodView === 'daily'
                        ? 'bg-white text-stone-800 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Daily Ledger
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {financePeriodView === 'monthly' ? (
                    <>
                      <span className="text-xs font-semibold text-stone-600 font-mono">Select Month:</span>
                      <select
                        id="select-finance-period-month"
                        value={selectedFinMonth}
                        onChange={(e) => setSelectedFinMonth(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-3xs cursor-pointer"
                      >
                        <option value="All">All-Time Cumulative</option>
                        {availableMonths.map((m) => (
                          <option key={m} value={m}>
                            {new Date(m + "-02").toLocaleString("default", { month: "long", year: "numeric" })} ({m})
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-stone-600 font-mono">Select Day:</span>
                      <div className="flex items-center gap-1">
                        <select
                          id="select-finance-period-day"
                          value={selectedFinDate}
                          onChange={(e) => setSelectedFinDate(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-3xs cursor-pointer font-mono"
                        >
                          <option value={new Date().toISOString().split('T')[0]}>Today ({new Date().toISOString().split('T')[0]})</option>
                          {availableDates.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <input
                          id="input-finance-period-day-picker"
                          type="date"
                          value={selectedFinDate}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedFinDate(e.target.value);
                            }
                          }}
                          className="bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer h-[32px] w-[34px] flex items-center justify-center font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Tier Financial Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-emerald-600 font-bold font-mono block uppercase">Gross Invoiced Revenue</span>
                <span className="text-2xl font-black text-emerald-950">Ksh {totalCombinedRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Clinical + Lab + Drugs Receipts</span>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-rose-600 font-bold font-mono block uppercase">Total Branch Expenses</span>
                <span className="text-2xl font-black text-rose-950">Ksh {totalExpenses.toLocaleString()}</span>
                <span className="text-[10px] text-rose-700 block mt-0.5">Recurrent + Other Outflows</span>
              </div>

              <div className={`p-4 rounded-xl border shadow-xs ${netBalance >= 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}`}>
                <span className="text-[10px] text-amber-700 font-bold font-mono block uppercase">Net Cash Balance</span>
                <span className="text-2xl font-black text-amber-950">Ksh {netBalance.toLocaleString()}</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Retained Treasury Earnings</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-stone-400 font-mono block uppercase">Branch Net Performance</span>
                <span className="text-2xl font-black text-stone-800">{profitMargin.toFixed(1)}%</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Operational Profit Margin</span>
              </div>
            </div>

            {/* Periodic Administrative Audit PDF Reports Generator Section */}
            <div id="admin-reports-audit-section" className="bg-gradient-to-br from-stone-50 to-amber-50/20 border border-stone-200 p-5 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-amber-600 animate-pulse" />
                    Periodic Administrative Audit PDF Reports Generator
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Export beautifully formatted, print-ready administrative compliance ledgers of cash patients, insurance details, diagnosed lab tests, and pharmacy prescriptions.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-trigger-all-audit-pdf"
                  onClick={handleGenerateReportPDF}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
                >
                  <Download className="w-4 h-4" />
                  Generate Audit PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Report Target (Category) */}
                <div>
                  <label id="lbl-audit-target" className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">1. Target Registry Department</label>
                  <select
                    id="audit-report-target-select"
                    value={reportTarget}
                    onChange={(e) => setReportTarget(e.target.value as any)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="cash">💵 Cash-Paying Outpatients</option>
                    <option value="insurance">🛡️ Insurance-Covered Patients</option>
                    <option value="lab">🧪 Laboratory Tests Conducted</option>
                    <option value="pharmacy">💊 Pharmacy Prescriptions Dispensed</option>
                  </select>
                </div>

                {/* 2. Reporting Period Type */}
                <div>
                  <label id="lbl-audit-frequency" className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">2. Reporting Frequency / Period</label>
                  <select
                    id="audit-report-period-type-select"
                    value={reportPeriodType}
                    onChange={(e) => setReportPeriodType(e.target.value as any)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="daily">📆 Daily Journal</option>
                    <option value="weekly">🗓️ Weekly Audit Range</option>
                    <option value="monthly">📅 Monthly Financial Ledger</option>
                    <option value="quarterly">📐 Quarterly Business Statement</option>
                    <option value="yearly">🏛️ Yearly Institutional Report</option>
                  </select>
                </div>

                {/* 3. Contextual Data Selector */}
                <div>
                  <label id="lbl-audit-scope" className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">3. Select Date / Period Scope</label>
                  
                  {reportPeriodType === 'daily' && (
                    <input
                      id="audit-report-date-daily"
                      type="date"
                      value={reportCustomDate}
                      onChange={(e) => setReportCustomDate(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer font-mono"
                    />
                  )}

                  {reportPeriodType === 'weekly' && (
                    <div className="space-y-1">
                      <input
                        id="audit-report-date-weekly"
                        type="date"
                        value={reportCustomDate}
                        onChange={(e) => setReportCustomDate(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer font-mono"
                      />
                      {(() => {
                        const targetDate = new Date(reportCustomDate);
                        const day = targetDate.getDay();
                        const diff = targetDate.getDate() - day;
                        const sun = new Date(targetDate.setDate(diff));
                        const sat = new Date(sun.getTime() + 6 * 24 * 60 * 60 * 1000);
                        return (
                          <span className="text-[10px] text-indigo-600 block font-mono font-medium mt-0.5">
                            Scope: {sun.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - {sat.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {reportPeriodType === 'monthly' && (
                    <input
                      id="audit-report-date-monthly"
                      type="month"
                      value={reportCustomMonth}
                      onChange={(e) => setReportCustomMonth(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer font-mono"
                    />
                  )}

                  {reportPeriodType === 'quarterly' && (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        id="audit-report-quarter-select"
                        value={reportCustomQuarter}
                        onChange={(e) => setReportCustomQuarter(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                      >
                        <option value="1">Q1 (Jan - Mar)</option>
                        <option value="2">Q2 (Apr - Jun)</option>
                        <option value="3">Q3 (Jul - Sep)</option>
                        <option value="4">Q4 (Oct - Dec)</option>
                      </select>
                      <select
                        id="audit-report-quarter-year-select"
                        value={reportCustomYear}
                        onChange={(e) => setReportCustomYear(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer font-mono"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                  )}

                  {reportPeriodType === 'yearly' && (
                    <select
                      id="audit-report-yearly-select"
                      value={reportCustomYear}
                      onChange={(e) => setReportCustomYear(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-semibold text-stone-700 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer font-mono"
                    >
                      <option value="2026">2026 Financial Year</option>
                      <option value="2025">2025 Financial Year</option>
                      <option value="2027">2027 Financial Year</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Departmental Revenue Breakdown Panel */}
            <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-xs">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Treasury Revenue Streams Breakdown (Including Non-Pharmaceuticals)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Channel 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Clinical Intake Consults</span>
                    <span>Ksh {patientRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (patientRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((patientRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Laboratory Diagnostics</span>
                    <span>Ksh {labRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (labRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((labRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Pharmaceutical Prescriptions</span>
                    <span>Ksh {pharmaRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (pharmaRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((pharmaRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Non-Pharmaceutical Supplies</span>
                    <span>Ksh {nonPharmaRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (nonPharmaRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((nonPharmaRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Graphs & Pie Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart & Cashflow Breakdown Component */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 lg:col-span-1 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  Branch Outflows Ledger Spends
                </h3>

                {totalExpenses === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/60 p-4 text-center">
                    <span className="text-stone-400 text-xs">No active expenses recorded on ledger.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ring Chart Simulation using Circular SVGs */}
                    <div className="flex justify-center py-2">
                      <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* Base Circle */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f4" strokeWidth="12" />
                        {(() => {
                          const r = 40;
                          const c = 2 * Math.PI * r; // 251.3
                          let currentOffset = 0;

                          const spendCategories = [
                            { name: 'Electricity', amount: electricityExpenses, color: '#f59e0b' },
                            { name: 'Water', amount: waterExpenses, color: '#0ea5e9' },
                            { name: 'Security', amount: securityExpenses, color: '#6366f1' },
                            { name: 'Other', amount: otherExpenses, color: '#10b981' }
                          ].filter(cat => cat.amount > 0);

                          return spendCategories.map((cat, i) => {
                            const pct = cat.amount / totalExpenses;
                            const dashArray = `${pct * c} ${c}`;
                            const strokeOffset = -currentOffset;
                            currentOffset += pct * c;

                            return (
                              <circle
                                key={cat.name}
                                cx="50"
                                cy="50"
                                r={r}
                                fill="none"
                                stroke={cat.color}
                                strokeWidth="12"
                                strokeDasharray={dashArray}
                                strokeDashoffset={strokeOffset}
                                className="transition-all duration-300"
                              />
                            );
                          });
                        })()}
                      </svg>
                    </div>

                    {/* Spend Category Progress Meters */}
                    <div className="space-y-2.5 text-xs text-stone-600">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                            🔌 Electricity Power Tokens
                          </span>
                          <span className="font-bold text-stone-900">Ksh {electricityExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${(electricityExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                            💧 Water & Utility Mains
                          </span>
                          <span className="font-bold text-stone-900">Ksh {waterExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full" style={{ width: `${(waterExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shrink-0" />
                            🛡️ Guard Patrol & Security
                          </span>
                          <span className="font-bold text-stone-900">Ksh {securityExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${(securityExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                            📦 Other Unscheduled Outflows
                          </span>
                          <span className="font-bold text-stone-900">Ksh {otherExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(otherExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced SVG Daily Growth trend chart */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 lg:col-span-2 space-y-4 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Karatina HQ Revenue/Expense Balance Growth Trend
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Expenses</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Profit Curve</span>
                  </div>
                </div>

                {/* SVG Visual Graph rendering */}
                <div className="relative border border-stone-100 rounded-xl bg-stone-50/50 p-2">
                  <svg viewBox="0 0 500 150" className="w-full h-auto overflow-visible">
                    {/* Horizontal Guidelines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f3f5" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="40" y1="75" x2="480" y2="75" stroke="#f1f3f5" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="40" y1="130" x2="480" y2="130" stroke="#e5e5e0" strokeWidth="1" />

                    {/* Grid labels */}
                    <text x="10" y="24" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>{Math.floor(maxVal).toLocaleString()}</text>
                    <text x="10" y="79" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>{Math.floor(maxVal/2).toLocaleString()}</text>
                    <text x="15" y="133" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>0</text>

                    {/* Revenue Line */}
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={revenuePoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`rev-dot-${i}`} cx={getX(i)} cy={getY(m.revenue)} r="3" fill="#10b981" />
                    ))}

                    {/* Expense Line */}
                    <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={expensePoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`exp-dot-${i}`} cx={getX(i)} cy={getY(m.expense)} r="3" fill="#f43f5e" />
                    ))}

                    {/* Net Profit Line */}
                    <polyline fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3,1" strokeLinecap="round" strokeLinejoin="round" points={profitPoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`prof-dot-${i}`} cx={getX(i)} cy={getY(m.profit)} r="3" fill="#4f46e5" />
                    ))}

                    {/* X-Axis Date Strings */}
                    {dailyMetrics.map((m, i) => (
                      <text
                        key={`x-label-${i}`}
                        x={getX(i)}
                        y="145"
                        textAnchor="middle"
                        className="fill-stone-400 font-mono font-medium"
                        style={{ fontSize: '6px' }}
                      >
                        {m.date.substring(5)}
                      </text>
                    ))}
                  </svg>
                </div>

                {/* Growth Analysis Summary list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Average Daily Sales</span>
                    <span className="font-bold text-stone-800">
                      Ksh {Math.floor((totalCombinedRevenue || 1) / trendDates.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Max Growth Node</span>
                    <span className="font-bold text-emerald-700">
                      Ksh {Math.max(...dailyMetrics.map(m => m.profit)).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Expense Index Variance</span>
                    <span className="font-bold text-rose-600">
                      Ksh {Math.floor((totalExpenses || 1) / trendDates.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">EBITDA Indicator</span>
                    <span className="font-bold text-indigo-700">Excellent (Stable)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Ledger Registry Control Desk */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Satellite Branch Operations Outlay Audit Ledger</h3>
                  <p className="text-stone-500 text-xs">
                    Authorize branch operational costs, utility payments, electricity recharges, security service allocations, and view historical transaction receipts.
                  </p>
                </div>
                <button
                  id="btn-admin-record-expense"
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Record Expense
                </button>
              </div>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 uppercase font-mono tracking-wider text-[10px]">
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Disbursement Date</th>
                      <th className="py-2.5">Transaction Remarks / Description</th>
                      <th className="py-2.5">Recorded By</th>
                      <th className="py-2.5 text-right">Amount (Ksh)</th>
                      <th className="py-2.5 text-right">Revoke / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {expenses.map((exp) => (
                      <tr id={`expense-row-${exp.id}`} key={exp.id} className="hover:bg-stone-50/50">
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            exp.category === 'Electricity'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : exp.category === 'Water'
                              ? 'bg-sky-50 text-sky-700 border-sky-100'
                              : exp.category === 'Security'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono">{exp.date}</td>
                        <td className="py-3.5 max-w-[320px] truncate" title={exp.description}>{exp.description}</td>
                        <td className="py-3.5 text-stone-500 font-mono text-[10px]">{exp.recordedBy}</td>
                        <td className="py-3.5 text-right font-bold text-stone-800">Ksh {exp.amount.toLocaleString()}</td>
                        <td className="py-3.5 text-right">
                          <button
                            id={`btn-remove-expense-${exp.id}`}
                            onClick={() => {
                              if (confirm(`Do you wish to delete and purge this KSh ${exp.amount.toLocaleString()} expense row?`)) {
                                onRemoveExpense(exp.id);
                                alert('Expense record permanently purged.');
                              }
                            }}
                            className="text-rose-600 hover:text-rose-900 font-mono text-[10px] font-bold transition-colors inline-flex items-center gap-0.5"
                          >
                            <Trash className="w-3 h-3" /> Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 bg-stone-50/30 rounded-lg">
                          No registered expenses on ledger sheet data. Click "Record Expense" to authorize operational outflows.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>



            {/* Floating Expenses Record Ledger Modal overlay dialog */}
            {showExpenseModal && (
              <div id="expense-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white border border-stone-200 shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in duration-250">
                  <div className="bg-amber-600 text-white px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Record Branch Ledger Outflow</h3>
                    </div>
                    <button
                      id="btn-close-expense-modal"
                      onClick={() => setShowExpenseModal(false)}
                      className="hover:bg-amber-700 p-1 rounded-md transition-all text-white/80 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4 text-xs leading-relaxed">
                    <div>
                      <label id="lbl-exp-category" className="block text-stone-600 font-bold mb-1">Expense Stream Category</label>
                      <select
                        id="select-exp-category"
                        required
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500 font-medium"
                      >
                        <option value="Electricity">Electricity power token recharge</option>
                        <option value="Water">Water & San utilities payment</option>
                        <option value="Security">Guards & security patrols</option>
                        <option value="Other">Other Operational expenses</option>
                      </select>
                    </div>

                    {expenseCategory === 'Other' && (
                      <div>
                        <label id="lbl-exp-custom" className="block text-stone-600 font-bold mb-1">Specify Custom spend Category</label>
                        <input
                          id="inp-exp-custom"
                          type="text"
                          required
                          placeholder="e.g. Pharmaceutical storage fridge repairs"
                          value={expenseCustomCategory}
                          onChange={(e) => setExpenseCustomCategory(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    <div>
                      <label id="lbl-exp-amount" className="block text-stone-600 font-bold mb-1">Actual Spends Cost (Ksh)</label>
                      <input
                        id="inp-exp-amount"
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 15000"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500 font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label id="lbl-exp-date" className="block text-stone-600 font-bold mb-1">Payment / Disbursement Date</label>
                      <input
                        id="inp-exp-date"
                        type="date"
                        required
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 font-mono"
                      />
                    </div>

                    <div>
                      <label id="lbl-exp-notes" className="block text-stone-600 font-bold mb-1">Service description & details</label>
                      <textarea
                        id="inp-exp-notes"
                        required
                        rows={3}
                        placeholder="e.g. KPLC token for branch emergency diagnostic main building backup grid"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                      <button
                        id="btn-cancel-expense"
                        type="button"
                        onClick={() => setShowExpenseModal(false)}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-submit-expense"
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                      >
                        Authorize Spend
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* B. STAFF SHIFT DUTY ALLOCATOR SCREEN */}
      {activeAdminSub === 'rosters' && (
        <div id="admin-rosters-submodule" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <CalendarPlus className="w-4.5 h-4.5 text-emerald-600" />
              Commit Shift Duty Roster
            </h3>

            <form onSubmit={handleAddDutySubmit} className="space-y-4 text-xs">
              <div>
                <label id="lbl-duty-staff" className="block font-medium text-stone-500 mb-1">Select Whitelisted Staff</label>
                <select
                  id="select-duty-staff"
                  required
                  value={dutyEmail}
                  onChange={(e) => setDutyEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Member --</option>
                  {whitelist.map((w) => (
                    <option key={w.email} value={w.email}>
                      🧑‍⚕️ {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label id="lbl-duty-shift" className="block font-medium text-stone-500 mb-1">Shift Type</label>
                <select
                  id="select-duty-shift"
                  value={dutyShift}
                  onChange={(e) => setDutyShift(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Day Shift">Day Shift (08:00 - 17:00)</option>
                  <option value="Night Shift">Night Shift (17:00 - 08:00)</option>
                  <option value="On Call">On Call (Specialist Backup)</option>
                </select>
              </div>

              <div>
                <label id="lbl-duty-dept" className="block font-medium text-stone-500 mb-1">Roster Department</label>
                <select
                  id="select-duty-dept"
                  value={dutyDept}
                  onChange={(e) => setDutyDept(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Clinical">Clinical/Consultations</option>
                  <option value="Reception">Reception & Records Desk</option>
                  <option value="Lab">Lab Diagnostic Center</option>
                  <option value="Pharmacy">Pharmacy Dispensary</option>
                  <option value="Admin">Management Office</option>
                </select>
              </div>

              <div>
                <label id="lbl-duty-date" className="block font-medium text-stone-500 mb-1">Duty Date</label>
                <input
                  id="inp-duty-date"
                  type="date"
                  required
                  value={dutyDate}
                  onChange={(e) => setDutyDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2"
                />
              </div>

              <button
                id="btn-add-duty-submit"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
              >
                Approve & Register Duty Row
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800">Master Rotating Shift Rota Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2">Staff Member</th>
                    <th className="py-2">Date Allocated</th>
                    <th className="py-2">Shift Program</th>
                    <th className="py-2">Active Dept</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {duties.map((d) => (
                    <tr id={`duty-row-${d.id}`} key={d.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-medium">{d.staffName}</td>
                      <td className="py-2.5 font-mono">{d.date}</td>
                      <td className="py-2.5">{d.shift}</td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {d.department}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          id={`btn-remove-duty-${d.id}`}
                          onClick={() => {
                            onRemoveDuty(d.id);
                            alert('Shift record deleted successfully.');
                          }}
                          className="text-rose-600 hover:text-rose-900 flex items-center gap-1 font-mono text-[10px]"
                        >
                          <Trash className="w-3 h-3" /> Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* C. LEAVE PROCESS CENTER SCREEN */}
      {activeAdminSub === 'leaves' && (
        <div id="admin-leaves-submodule" className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed space-y-4">
          <h3 className="text-sm font-semibold text-stone-800">Pending & Historical Staff Leave Requests</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-medium">
                  <th className="py-2">Employee Details</th>
                  <th className="py-2">Duration requested</th>
                  <th className="py-2">Asserted Reason</th>
                  <th className="py-2">Request Status</th>
                  <th className="py-2 text-right">Approve/Deny Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {leaves.map((l) => (
                  <tr id={`leave-row-${l.id}`} key={l.id} className="hover:bg-stone-50/50">
                    <td className="py-3">
                      <span className="font-bold block text-stone-800">{l.staffName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{l.staffEmail}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold">{l.startDate} to {l.endDate}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">Filed: {new Date(l.requestedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 max-w-[200px] truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        l.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : l.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`btn-approve-leave-${l.id}`}
                            onClick={() => {
                              onUpdateLeaveStatus(l.id, 'Approved');
                              alert('Leave request Approved successfully.');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium px-2 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button
                            id={`btn-reject-leave-${l.id}`}
                            onClick={() => {
                              onUpdateLeaveStatus(l.id, 'Rejected');
                              alert('Leave request Rejected.');
                            }}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-medium px-2 py-1 rounded"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">No leave requests registered in system files.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* D. SECURE EMAIL WHITELIST MANAGER SCREEN */}
      {activeAdminSub === 'whitelist' && (
        <div id="admin-whitelist-submodule" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-emerald-600" />
              Whitelist New Account Email
            </h3>

            <form onSubmit={handleAddWhitelistSubmit} className="space-y-4 text-xs">
              <div>
                <label id="lbl-wl-email" className="block font-medium text-stone-500 mb-1">Staff Google Email Address</label>
                <input
                  id="inp-wl-email"
                  type="email"
                  required
                  placeholder="e.g. nurse@tumutumu.org"
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label id="lbl-wl-name" className="block font-medium text-stone-500 mb-1">Staff Member Name</label>
                <input
                  id="inp-wl-name"
                  type="text"
                  required
                  placeholder="e.g. Sister Mercy Wambugu"
                  value={wlName}
                  onChange={(e) => setWlName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label id="lbl-wl-role" className="block font-medium text-stone-500 mb-1">Roster Role Category</label>
                <select
                  id="select-wl-role"
                  value={wlRole}
                  onChange={(e) => setWlRole(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Doctor">Doctor (Clinical Officer / consultant)</option>
                  <option value="Reception">Reception & Records coordinator</option>
                  <option value="Triage">Triage Nurse / Officer (Vitals & physiological details)</option>
                  <option value="Lab">Lab Technologist</option>
                  <option value="Pharmacy">Pharmacist / Dispatcher</option>
                  <option value="Admin">Administrator (Roster Coordinator / CFO)</option>
                </select>
              </div>

              <button
                id="btn-add-whitelist-submit"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
              >
                Whitelist Account Email
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800">Tumutumu Secure Google Whitelisted Accounts List</h3>
            <p className="text-stone-500 text-xs">
              Personnel holding verified emails listed here can bypass security gates and access their respective role-based patient files, lab diagnostics and stocking rosters.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2">Staff Member Name</th>
                    <th className="py-2">Whitelisted Email</th>
                    <th className="py-2">Roster Role</th>
                    <th className="py-2 text-right">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {whitelist.map((item) => (
                    <tr id={`wl-row-${item.email}`} key={item.email} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-bold text-stone-800">{item.name}</td>
                      <td className="py-2.5 font-mono text-stone-500">{item.email}</td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-800">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {item.email === 'gmaurice101@gmail.com' ? (
                          <span className="text-[10px] text-stone-400 font-mono italic">Primary Creator</span>
                        ) : (
                          <button
                            id={`btn-remove-wl-${item.email}`}
                            onClick={() => {
                              onRemoveWhitelist(item.email);
                              alert('Whitelisted email revoked.');
                            }}
                            className="text-stone-500 hover:text-rose-600 p-1"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* E. GOOGLE SHEETS CONNECTOR SCREEN */}
      {activeAdminSub === 'sheets' && (
        <GoogleSheetsView
          patients={patients}
          labTests={labTests}
          appointments={appointments}
          dispenses={dispenses}
          stock={stock}
          expenses={expenses}
          userEmail={currentUserEmail}
        />
      )}

      {/* F. SYSTEM AUDITING LEDGER */}
      {activeAdminSub === 'audit' && (
        <div id="admin-audit-subview" className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-sans font-semibold text-base text-stone-950 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-600" />
                  System Mutation Records & Auditing Logs
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time ledger tracking of whitelist entries, patient registrations, clinical diagnostics, inventory restocks, medications dispensing, and cash payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-stone-100 text-stone-600 py-1 px-3 rounded-full border border-stone-200">
                  Total Entries: <strong className="text-stone-900">{auditLogs.length}</strong>
                </span>
              </div>
            </div>

            {/* Filter and search utilities */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Search mutations</label>
                <input
                  type="text"
                  placeholder="Filter by action, details..."
                  className="w-full text-xs border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-stone-400 bg-stone-50"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Filter by Staff Email</label>
                <input
                  type="text"
                  placeholder="e.g. pharmacist@tumutumu.org"
                  className="w-full text-xs border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-stone-400 bg-stone-50"
                  onChange={(e) => setEmailTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Severity Level</label>
                <select
                  className="w-full text-xs border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-stone-50"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="all">All Level severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Trail List */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Subject Person / Actor</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Mutation Description Details</th>
                    <th className="py-3 px-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No auditing mutation records matched the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="py-3 px-4 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          }) : '-'}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-800">
                          <span className="bg-stone-100 border border-stone-200 rounded-md py-0.5 px-1.5 font-mono text-[10px] text-stone-600">
                            {log.userEmail}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[10px] tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200/50 rounded-md py-0.5 px-1.5 whitespace-nowrap">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md text-stone-600">
                          <span className="block break-words" title={log.details}>
                            {log.details}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            log.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            log.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.severity === 'critical' ? 'bg-red-500' :
                              log.severity === 'warning' ? 'bg-amber-500' :
                              'bg-blue-500'
                            }`} />
                            {log.severity?.toUpperCase() || 'INFO'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
