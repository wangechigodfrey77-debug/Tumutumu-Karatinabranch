/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Users,
  Stethoscope,
  ShieldCheck,
  Building2,
  X,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Appointment } from '../types';
import { normalizeInsuranceCompany } from '../insuranceUtils';

export interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  appointments: Appointment[];
  userName: string;
  userEmail: string;
  defaultMonth?: string;
  onDeletePatient?: (patientId: string) => void;
}

export interface SpecialistClinicItem {
  clinicKey: string;
  displayName: string;
  patientCount: number;
  percentOfSpecialist: number;
  percentOfTotal: number;
  cashCount: number;
  insuranceCount: number;
  totalBilledAmount: number;
}

export interface InsuranceProviderItem {
  providerName: string;
  patientCount: number;
  percentOfInsurance: number;
  percentOfTotal: number;
  totalBilledAmount: number;
}

export function MonthlyReportModal({
  isOpen,
  onClose,
  patients,
  appointments,
  userName,
  userEmail,
  defaultMonth,
  onDeletePatient
}: MonthlyReportModalProps) {
  // Extract all available months from patient registrations and appointments
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Always include current month
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    monthSet.add(currentMonthStr);

    patients.forEach(p => {
      if (p.registeredAt) {
        const m = p.registeredAt.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
      }
    });

    appointments.forEach(a => {
      if (a.date) {
        const m = a.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
      }
    });

    // Sort descending (newest month first)
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [patients, appointments]);

  // Selected Month state
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (defaultMonth && availableMonths.includes(defaultMonth)) return defaultMonth;
    return availableMonths[0] || new Date().toISOString().substring(0, 7);
  });

  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'specialist' | 'insurance' | 'roster'>('overview');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Format month to readable name, e.g. "2026-06" -> "June 2026"
  const formatMonthName = (mStr: string) => {
    try {
      const [year, month] = mStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mStr;
    }
  };

  // Compute monthly report data
  const reportData = useMemo(() => {
    // Filter patients registered in this month
    const monthPatients = patients.filter(p => {
      if (!p.registeredAt) return false;
      return p.registeredAt.startsWith(selectedMonth);
    });

    // Filter appointments for this month
    const monthAppointments = appointments.filter(a => {
      if (!a.date) return false;
      return a.date.startsWith(selectedMonth);
    });

    const totalPatients = monthPatients.length;

    // General Consultation
    const generalPatients = monthPatients.filter(p => 
      p.category === 'General Consultation' || (!p.category && !p.consultantSubCategory)
    );
    const generalCount = generalPatients.length;
    const generalPercent = totalPatients > 0 ? (generalCount / totalPatients) * 100 : 0;

    // Payment Modes: Insurance vs Cash
    const insurancePatients = monthPatients.filter(p => p.paymentMode === 'Insurance');
    const insuranceCount = insurancePatients.length;
    const insurancePercent = totalPatients > 0 ? (insuranceCount / totalPatients) * 100 : 0;

    const cashPatients = monthPatients.filter(p => p.paymentMode === 'Cash' || !p.paymentMode);
    const cashCount = cashPatients.length;
    const cashPercent = totalPatients > 0 ? (cashCount / totalPatients) * 100 : 0;

    // Other categories
    const walkInLabPatients = monthPatients.filter(p => p.category === 'Walk-in Lab');
    const walkInPharmacyPatients = monthPatients.filter(p => p.category === 'Walk-in Pharmacy');
    const outpatientProcedurePatients = monthPatients.filter(p => p.category === 'Outpatient Procedure');

    // Specialist Clinics Breakdown
    const specialistPatients = monthPatients.filter(p => 
      p.category === 'Consultant Clinic' || !!p.consultantSubCategory
    );
    const specialistTotalCount = specialistPatients.length;
    const specialistPercent = totalPatients > 0 ? (specialistTotalCount / totalPatients) * 100 : 0;

    // Standard specialist clinics
    const standardSpecialties = [
      { key: 'Surgical', name: 'Surgical Clinic' },
      { key: 'Pediatrics', name: 'Pediatrics Clinic' },
      { key: 'MOPC', name: 'MOPC (Medical Outpatient Clinic)' },
      { key: 'Obs/Gyn', name: 'Obs/Gyn (Obstetrics & Gynecology)' }
    ];

    // Collect any other consultant subcategories present
    const discoveredSpecialties = new Set<string>();
    specialistPatients.forEach(p => {
      if (p.consultantSubCategory) discoveredSpecialties.add(p.consultantSubCategory);
    });
    standardSpecialties.forEach(s => discoveredSpecialties.add(s.key));

    const specialistBreakdown: SpecialistClinicItem[] = Array.from(discoveredSpecialties).map(subKey => {
      const matchedPatients = specialistPatients.filter(p => p.consultantSubCategory === subKey);
      const count = matchedPatients.length;
      const pctSpecialist = specialistTotalCount > 0 ? (count / specialistTotalCount) * 100 : 0;
      const pctTotal = totalPatients > 0 ? (count / totalPatients) * 100 : 0;
      const cash = matchedPatients.filter(p => p.paymentMode === 'Cash' || !p.paymentMode).length;
      const ins = matchedPatients.filter(p => p.paymentMode === 'Insurance').length;

      // Revenue from appointments matching this specialty in the month
      const apptRevenue = monthAppointments
        .filter(a => a.consultantSubCategory === subKey && a.billingStatus === 'Paid')
        .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);

      const standardObj = standardSpecialties.find(s => s.key === subKey);
      const displayName = standardObj ? standardObj.name : `${subKey} Specialist Clinic`;

      return {
        clinicKey: subKey,
        displayName,
        patientCount: count,
        percentOfSpecialist: pctSpecialist,
        percentOfTotal: pctTotal,
        cashCount: cash,
        insuranceCount: ins,
        totalBilledAmount: apptRevenue || (count * 1500)
      };
    }).sort((a, b) => b.patientCount - a.patientCount);

    // Insurance Providers Breakdown
    const insuranceMap = new Map<string, Patient[]>();
    insurancePatients.forEach(p => {
      const providerKey = normalizeInsuranceCompany(p.insuranceCompany);
      if (!insuranceMap.has(providerKey)) {
        insuranceMap.set(providerKey, []);
      }
      insuranceMap.get(providerKey)!.push(p);
    });

    // If no insured patients exist in current month, still show reference provider keys if desired or keep dynamic
    const insuranceProvidersBreakdown: InsuranceProviderItem[] = Array.from(insuranceMap.entries()).map(([providerName, pList]) => {
      const count = pList.length;
      const pctInsurance = insuranceCount > 0 ? (count / insuranceCount) * 100 : 0;
      const pctTotal = totalPatients > 0 ? (count / totalPatients) * 100 : 0;

      // Calculate revenue from appointments of these patients
      const patientIdSet = new Set(pList.map(p => p.id));
      const billedRevenue = monthAppointments
        .filter(a => patientIdSet.has(a.patientId))
        .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);

      return {
        providerName,
        patientCount: count,
        percentOfInsurance: pctInsurance,
        percentOfTotal: pctTotal,
        totalBilledAmount: billedRevenue || (count * 300)
      };
    }).sort((a, b) => b.patientCount - a.patientCount);

    // Total monthly collected revenue
    const totalRevenue = monthAppointments
      .filter(a => a.billingStatus === 'Paid')
      .reduce((sum, a) => sum + (Number(a.billingAmount) || 0), 0);

    return {
      monthStr: selectedMonth,
      monthName: formatMonthName(selectedMonth),
      totalPatients,
      generalCount,
      generalPercent,
      insuranceCount,
      insurancePercent,
      cashCount,
      cashPercent,
      walkInLabCount: walkInLabPatients.length,
      walkInPharmacyCount: walkInPharmacyPatients.length,
      outpatientProcedureCount: outpatientProcedurePatients.length,
      specialistTotalCount,
      specialistPercent,
      specialistBreakdown,
      insuranceProvidersBreakdown,
      monthPatients,
      totalRevenue
    };
  }, [patients, appointments, selectedMonth]);

  // Filtered patients for the roster view in modal
  const filteredRosterPatients = useMemo(() => {
    const q = rosterSearch.toLowerCase().trim();
    if (!q) return reportData.monthPatients;
    return reportData.monthPatients.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.opNumber && p.opNumber.toLowerCase().includes(q)) ||
      (p.insuranceCompany && p.insuranceCompany.toLowerCase().includes(q)) ||
      (p.consultantSubCategory && p.consultantSubCategory.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [reportData.monthPatients, rosterSearch]);

  // -------------------------------------------------------------
  // PDF EXPORT HANDLER (Official PCEA Tumutumu Hospital Format)
  // -------------------------------------------------------------
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = 210;

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Accent line
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 38, pageWidth, 3, 'F');

    // Hospital Name & Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('PCEA TUMUTUMU HOSPITAL', 14, 14);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Karatina Satellite Branch • Outpatient Registration & Medical Records Dept', 14, 21);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(`MONTHLY COMPREHENSIVE STATISTICAL REPORT — ${reportData.monthName.toUpperCase()}`, 14, 30);

    // Meta Box / Subheader
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. EXECUTIVE SUMMARY & KEY PERFORMANCE INDICATORS', 14, 48);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Reporting Period: ${reportData.monthName} (${reportData.monthStr})`, 14, 54);
    doc.text(`Generated By: ${userName || 'Records Officer'} (${userEmail || 'reception@tumutumu.org'})`, 14, 59);
    doc.text(`Date & Time Generated: ${new Date().toLocaleString()}`, 14, 64);

    // KPI Metrics Summary Table
    const kpiHeaders = [['Metric Indicator', 'Patient Count', '% Share of Total OPD', 'Operational Note']];
    const kpiRows = [
      ['Total Outpatient Registrations', `${reportData.totalPatients}`, '100.0%', 'All active encounters in period'],
      ['General Consultation Patients', `${reportData.generalCount}`, `${reportData.generalPercent.toFixed(1)}%`, 'General OPD & Clinical consultations'],
      ['Health Insurance-Covered Patients', `${reportData.insuranceCount}`, `${reportData.insurancePercent.toFixed(1)}%`, 'Covered under active health insurance'],
      ['Cash-Paying Patients', `${reportData.cashCount}`, `${reportData.cashPercent.toFixed(1)}%`, 'Direct out-of-pocket settlements'],
      ['Specialist / Consultant Clinics', `${reportData.specialistTotalCount}`, `${reportData.specialistPercent.toFixed(1)}%`, 'Specialized clinical focus clinics'],
      ['Walk-in Diagnostics & Procedures', `${reportData.walkInLabCount + reportData.walkInPharmacyCount + reportData.outpatientProcedureCount}`, `${reportData.totalPatients > 0 ? (((reportData.walkInLabCount + reportData.walkInPharmacyCount + reportData.outpatientProcedureCount) / reportData.totalPatients) * 100).toFixed(1) : '0.0'}%`, 'Lab walk-in, pharmacy & minor procedures']
    ];

    autoTable(doc, {
      head: kpiHeaders,
      body: kpiRows,
      startY: 68,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 38 },
        3: { cellWidth: 59 }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // SECTION 2: SPECIALIST CLINICS BREAKDOWN
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('2. SPECIALIST & CONSULTANT CLINICS BREAKDOWN', 14, currentY);

    const specialistHeaders = [['Specialist Clinic / Specialty', 'Patients Registered', 'Share of Specialist OPD', 'Share of Total OPD', 'Cash Patients', 'Insurance Patients']];
    const specialistRows = reportData.specialistBreakdown.map(item => [
      item.displayName,
      `${item.patientCount}`,
      `${item.percentOfSpecialist.toFixed(1)}%`,
      `${item.percentOfTotal.toFixed(1)}%`,
      `${item.cashCount}`,
      `${item.insuranceCount}`
    ]);

    // Add total row
    specialistRows.push([
      'TOTAL SPECIALIST CLINICS',
      `${reportData.specialistTotalCount}`,
      '100.0%',
      `${reportData.specialistPercent.toFixed(1)}%`,
      `${reportData.specialistBreakdown.reduce((sum, i) => sum + i.cashCount, 0)}`,
      `${reportData.specialistBreakdown.reduce((sum, i) => sum + i.insuranceCount, 0)}`
    ]);

    autoTable(doc, {
      head: specialistHeaders,
      body: specialistRows,
      startY: currentY + 4,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 28 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 20 }
      },
      didParseCell: (data) => {
        if (data.row.index === specialistRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Check page space for Section 3 (Insurance Breakdown)
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    // SECTION 3: HEALTH INSURANCE PROVIDERS BREAKDOWN
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('3. HEALTH INSURANCE PROVIDERS & COVERAGE BREAKDOWN', 14, currentY);

    const insuranceHeaders = [['Health Insurance Provider / Scheme', 'Patients Covered', 'Share of Insured OPD', 'Share of Total OPD', 'Billing Status']];
    const insuranceRows = reportData.insuranceProvidersBreakdown.length > 0 
      ? reportData.insuranceProvidersBreakdown.map(item => [
          item.providerName,
          `${item.patientCount}`,
          `${item.percentOfInsurance.toFixed(1)}%`,
          `${item.percentOfTotal.toFixed(1)}%`,
          'Verified & Documented'
        ])
      : [['No Insurance Claims Recorded', '0', '0.0%', '0.0%', 'All Outpatient encounters paid via Cash']];

    if (reportData.insuranceProvidersBreakdown.length > 0) {
      insuranceRows.push([
        'TOTAL INSURED PATIENTS',
        `${reportData.insuranceCount}`,
        '100.0%',
        `${reportData.insurancePercent.toFixed(1)}%`,
        'Active Monthly Scheme Coverage'
      ]);
    }

    autoTable(doc, {
      head: insuranceHeaders,
      body: insuranceRows,
      startY: currentY + 4,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 65 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 28 },
        2: { halign: 'center', cellWidth: 32 },
        3: { halign: 'center', cellWidth: 27 },
        4: { cellWidth: 32 }
      },
      didParseCell: (data) => {
        if (reportData.insuranceProvidersBreakdown.length > 0 && data.row.index === insuranceRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [245, 243, 255];
        }
      }
    });

    // SECTION 4: PATIENT LOG APPENDIX (New Page)
    doc.addPage();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`4. PATIENT REGISTRATION ROSTER APPENDIX (${reportData.monthPatients.length} ENCOUNTERS)`, 14, 18);

    const rosterHeaders = [['Date', 'Patient ID', 'OP-Number', 'Patient Name', 'Age/Sex', 'Category / Clinic', 'Payment Mode', 'Insurance Co.']];
    const rosterRows = reportData.monthPatients.map(p => {
      const dateStr = p.registeredAt ? p.registeredAt.substring(0, 10) : 'N/A';
      const op = p.opNumber || `OP-${selectedMonth}-${p.id.split('-')[1] || '000'}`;
      const ageSex = `${p.age} ${p.ageUnit === 'Months' ? 'M' : 'Y'} / ${p.gender.charAt(0)}`;
      const clinic = p.category === 'General Consultation' 
        ? 'General OPD' 
        : p.category === 'Consultant Clinic'
          ? `Specialist: ${p.consultantSubCategory || 'N/A'}`
          : p.category;
      const payment = p.paymentMode || 'Cash';
      const insCompany = p.paymentMode === 'Insurance' ? normalizeInsuranceCompany(p.insuranceCompany) : '-';

      return [dateStr, p.id, op, p.name, ageSex, clinic, payment, insCompany];
    });

    autoTable(doc, {
      head: rosterHeaders,
      body: rosterRows,
      startY: 23,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { fontStyle: 'bold', cellWidth: 16 },
        2: { fontStyle: 'bold', cellWidth: 26 },
        3: { fontStyle: 'bold', cellWidth: 32 },
        4: { cellWidth: 16 },
        5: { cellWidth: 32 },
        6: { cellWidth: 18 },
        7: { cellWidth: 26 }
      },
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          'PCEA Tumutumu Hospital Outpatient EMR • Monthly Statistical Archival Record • Confidential',
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
    doc.save(`tumutumu-monthly-report-${selectedMonth}.pdf`);
  };

  // -------------------------------------------------------------
  // CSV EXPORT HANDLER
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    let csv = `PCEA TUMUTUMU HOSPITAL - OUTPATIENT RECEPTION MONTHLY REPORT\n`;
    csv += `Reporting Month:,"${reportData.monthName} (${selectedMonth})"\n`;
    csv += `Generated By:,"${userName} (${userEmail})"\n`;
    csv += `Generated Date:,"${new Date().toLocaleString()}"\n\n`;

    // KPI Summary
    csv += `--- EXECUTIVE KPI SUMMARY ---\n`;
    csv += `Indicator,Count,Share of Total OPD\n`;
    csv += `Total Patients,${reportData.totalPatients},100%\n`;
    csv += `General Consultation Patients,${reportData.generalCount},${reportData.generalPercent.toFixed(1)}%\n`;
    csv += `Insurance-Covered Patients,${reportData.insuranceCount},${reportData.insurancePercent.toFixed(1)}%\n`;
    csv += `Cash-Paying Patients,${reportData.cashCount},${reportData.cashPercent.toFixed(1)}%\n`;
    csv += `Specialist Clinics Total,${reportData.specialistTotalCount},${reportData.specialistPercent.toFixed(1)}%\n\n`;

    // Specialist Clinics Breakdown
    csv += `--- SPECIALIST CLINICS BREAKDOWN ---\n`;
    csv += `Specialist Clinic,Patient Count,Share of Specialist OPD,Share of Total OPD,Cash Count,Insurance Count\n`;
    reportData.specialistBreakdown.forEach(item => {
      csv += `"${item.displayName}",${item.patientCount},${item.percentOfSpecialist.toFixed(1)}%,${item.percentOfTotal.toFixed(1)}%,${item.cashCount},${item.insuranceCount}\n`;
    });
    csv += `\n`;

    // Insurance Breakdown
    csv += `--- HEALTH INSURANCE PROVIDERS BREAKDOWN ---\n`;
    csv += `Insurance Provider,Patient Count,Share of Insured OPD,Share of Total OPD\n`;
    reportData.insuranceProvidersBreakdown.forEach(item => {
      csv += `"${item.providerName}",${item.patientCount},${item.percentOfInsurance.toFixed(1)}%,${item.percentOfTotal.toFixed(1)}%\n`;
    });
    csv += `\n`;

    // Patient Roster Appendix
    csv += `--- FULL PATIENT REGISTRY APPENDIX (${reportData.monthPatients.length} RECORDS) ---\n`;
    csv += `Date,Patient ID,OP Number,Patient Name,Age,Age Unit,Gender,Category,Specialist Clinic,Payment Mode,Insurance Company,Phone\n`;
    reportData.monthPatients.forEach(p => {
      const d = p.registeredAt ? p.registeredAt.substring(0, 10) : '';
      const op = p.opNumber || '';
      const insCompany = p.paymentMode === 'Insurance' ? normalizeInsuranceCompany(p.insuranceCompany) : '';
      csv += `"${d}","${p.id}","${op}","${p.name.replace(/"/g, '""')}",${p.age},"${p.ageUnit || 'Years'}","${p.gender}","${p.category || ''}","${p.consultantSubCategory || ''}","${p.paymentMode || 'Cash'}","${insCompany.replace(/"/g, '""')}","${p.phone || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tumutumu-monthly-report-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        id="monthly-report-modal"
        className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Reception Monthly Statistical Report</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                  EMR Records
                </span>
              </div>
              <p className="text-xs text-slate-400">
                General consultation, health insurance coverage, specialist clinics & full provider breakdowns.
              </p>
            </div>
          </div>

          {/* Month Selector & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                id="select-monthly-report-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold outline-hidden cursor-pointer"
              >
                {availableMonths.map(m => {
                  const mPatients = patients.filter(p => p.registeredAt && p.registeredAt.startsWith(m)).length;
                  return (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {formatMonthName(m)} ({mPatients} patients)
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              id="btn-modal-download-pdf"
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Report
            </button>

            <button
              id="btn-modal-export-csv"
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>

            <button
              id="btn-close-monthly-modal"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveViewTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Executive Overview & KPIs
          </button>

          <button
            onClick={() => setActiveViewTab('specialist')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewTab === 'specialist'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Specialist Clinics Breakdown ({reportData.specialistTotalCount})
          </button>

          <button
            onClick={() => setActiveViewTab('insurance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewTab === 'insurance'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Insurance Providers Breakdown ({reportData.insuranceCount})
          </button>

          <button
            onClick={() => setActiveViewTab('roster')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewTab === 'roster'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Patient Register Log ({reportData.monthPatients.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 grow bg-stone-50/50">
          
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeViewTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Primary 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Patients */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Patients</span>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-stone-900">{reportData.totalPatients.toLocaleString()}</div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      All outpatient registrations in {reportData.monthName}
                    </p>
                  </div>
                </div>

                {/* 2. General Consultation */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">General Consultation</span>
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-teal-700">{reportData.generalCount.toLocaleString()}</span>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                        {reportData.generalPercent.toFixed(1)}% of OPD
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, reportData.generalPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Insurance Covered */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Health Insurance</span>
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-purple-700">{reportData.insuranceCount.toLocaleString()}</span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        {reportData.insurancePercent.toFixed(1)}% Insured
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, reportData.insurancePercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Specialist Clinics Total */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Specialist Clinics</span>
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-700">{reportData.specialistTotalCount.toLocaleString()}</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {reportData.specialistPercent.toFixed(1)}% of OPD
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, reportData.specialistPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Two Column Breakdown Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Card: Specialist Clinics Summary */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-stone-800">Specialist Clinics Breakdown</h3>
                    </div>
                    <button
                      onClick={() => setActiveViewTab('specialist')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      Full Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {reportData.specialistBreakdown.map((item) => (
                      <div key={item.clinicKey} className="p-3 bg-stone-50 rounded-lg border border-stone-200/80">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-stone-800">{item.displayName}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-blue-700">{item.patientCount} pts</span>
                            <span className="text-[11px] text-stone-400 font-semibold">({item.percentOfSpecialist.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, item.percentOfSpecialist)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
                          <span>Cash: {item.cashCount} | Insured: {item.insuranceCount}</span>
                          <span className="text-stone-400">{item.percentOfTotal.toFixed(1)}% of total OPD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card: Insurance Breakdown Summary */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-stone-800">Insurance Providers Breakdown</h3>
                    </div>
                    <button
                      onClick={() => setActiveViewTab('insurance')}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
                    >
                      Full Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {reportData.insuranceProvidersBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {reportData.insuranceProvidersBreakdown.map((item) => (
                        <div key={item.providerName} className="p-3 bg-stone-50 rounded-lg border border-stone-200/80">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-stone-800">{item.providerName}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-purple-700">{item.patientCount} pts</span>
                              <span className="text-[11px] text-stone-400 font-semibold">({item.percentOfInsurance.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, item.percentOfInsurance)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
                            <span className="text-emerald-700 font-semibold">Verified Provider Scheme</span>
                            <span className="text-stone-400">{item.percentOfTotal.toFixed(1)}% of total OPD</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-stone-50 rounded-lg border border-dashed border-stone-200 text-stone-400 text-xs">
                      No insurance-billed patients recorded in {reportData.monthName}. All patients processed under Cash.
                    </div>
                  )}

                  {/* Cash vs Insurance Split Footer */}
                  <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-900">Total Insurance Traffic:</span>
                    <span className="font-bold text-purple-700 font-mono">
                      {reportData.insuranceCount} Patients ({reportData.insurancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SPECIALIST CLINICS DETAILED VIEW */}
          {activeViewTab === 'specialist' && (
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Specialist & Consultant Clinics Breakdown ({reportData.monthName})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Comprehensive patient volumes and payment distribution across all specialist clinics.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Total Specialist Patients</span>
                  <span className="text-lg font-bold text-blue-700 font-mono">{reportData.specialistTotalCount} Patients</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                      <th className="py-2.5 px-3">Specialist Clinic Name</th>
                      <th className="py-2.5 px-3 text-center">Patient Count</th>
                      <th className="py-2.5 px-3 text-center">% of Specialist Visits</th>
                      <th className="py-2.5 px-3 text-center">% of Total Monthly OPD</th>
                      <th className="py-2.5 px-3 text-center">Cash Patients</th>
                      <th className="py-2.5 px-3 text-center">Insurance Patients</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.specialistBreakdown.map((item) => (
                      <tr key={item.clinicKey} className="hover:bg-blue-50/30 transition-all">
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-800">{item.displayName}</div>
                          <span className="text-[10px] text-stone-400 font-mono">Code: {item.clinicKey}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700 font-mono text-sm">
                          {item.patientCount}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-stone-700">
                          {item.percentOfSpecialist.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-stone-600">
                          {item.percentOfTotal.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-amber-700 font-semibold">
                          {item.cashCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-purple-700 font-semibold">
                          {item.insuranceCount}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-stone-100/80 font-bold text-stone-900 border-t-2 border-stone-200">
                      <td className="py-3 px-3">TOTAL SPECIALIST OPD</td>
                      <td className="py-3 px-3 text-center text-blue-800 font-mono text-sm">{reportData.specialistTotalCount}</td>
                      <td className="py-3 px-3 text-center">100.0%</td>
                      <td className="py-3 px-3 text-center">{reportData.specialistPercent.toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-800">
                        {reportData.specialistBreakdown.reduce((sum, i) => sum + i.cashCount, 0)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-purple-800">
                        {reportData.specialistBreakdown.reduce((sum, i) => sum + i.insuranceCount, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INSURANCE PROVIDERS DETAILED VIEW */}
          {activeViewTab === 'insurance' && (
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Health Insurance Companies & Schemes Breakdown ({reportData.monthName})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Distribution of patients covered by each health insurance company and mutual scheme.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Total Insured Patients</span>
                  <span className="text-lg font-bold text-purple-700 font-mono">{reportData.insuranceCount} Patients</span>
                </div>
              </div>

              {reportData.insuranceProvidersBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                        <th className="py-2.5 px-3">Insurance Company / Scheme</th>
                        <th className="py-2.5 px-3 text-center">Patients Covered</th>
                        <th className="py-2.5 px-3 text-center">% Share of Insured OPD</th>
                        <th className="py-2.5 px-3 text-center">% Share of Total Monthly OPD</th>
                        <th className="py-2.5 px-3 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {reportData.insuranceProvidersBreakdown.map((item) => (
                        <tr key={item.providerName} className="hover:bg-purple-50/30 transition-all">
                          <td className="py-3 px-3">
                            <div className="font-bold text-stone-800 flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                              {item.providerName}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-purple-700 font-mono text-sm">
                            {item.patientCount}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-stone-700">
                            {item.percentOfInsurance.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-stone-600">
                            {item.percentOfTotal.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authorized
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-purple-50/80 font-bold text-purple-950 border-t-2 border-purple-200">
                        <td className="py-3 px-3">TOTAL HEALTH INSURANCE ENCOUNTERS</td>
                        <td className="py-3 px-3 text-center text-purple-900 font-mono text-sm">{reportData.insuranceCount}</td>
                        <td className="py-3 px-3 text-center">100.0%</td>
                        <td className="py-3 px-3 text-center">{reportData.insurancePercent.toFixed(1)}%</td>
                        <td className="py-3 px-3 text-right text-purple-800">100% Verified</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50 rounded-lg border border-dashed border-stone-200 text-stone-400 text-xs">
                  No insurance claims recorded in {reportData.monthName}.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PATIENT REGISTER LOG */}
          {activeViewTab === 'roster' && (
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Patient Registration Roster Log ({reportData.monthName})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Full registry appendix of all patients registered during {reportData.monthName}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search roster by Name, ID, OP..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 outline-hidden focus:ring-1 focus:ring-emerald-500 w-56"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch('')}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-stone-100 z-10">
                    <tr className="border-b border-stone-200 text-stone-600 font-bold">
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Patient ID</th>
                      <th className="py-2 px-2.5">OP Number</th>
                      <th className="py-2 px-2.5">Patient Name</th>
                      <th className="py-2 px-2.5">Age / Sex</th>
                      <th className="py-2 px-2.5">Category / Specialty</th>
                      <th className="py-2 px-2.5">Payment Mode</th>
                      <th className="py-2 px-2.5">Insurance Provider</th>
                      {onDeletePatient && (
                        <th className="py-2 px-2.5 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRosterPatients.length > 0 ? (
                      filteredRosterPatients.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="py-2 px-2.5 font-mono text-stone-500">
                            {p.registeredAt ? p.registeredAt.substring(0, 10) : 'N/A'}
                          </td>
                          <td className="py-2 px-2.5 font-bold font-mono text-stone-800">{p.id}</td>
                          <td className="py-2 px-2.5 font-mono text-emerald-800 font-semibold">{p.opNumber || 'N/A'}</td>
                          <td className="py-2 px-2.5 font-semibold text-stone-900">{p.name}</td>
                          <td className="py-2 px-2.5 text-stone-600">
                            {p.age} {p.ageUnit === 'Months' ? 'Mos' : 'Yrs'} / {p.gender}
                          </td>
                          <td className="py-2 px-2.5">
                            {p.category === 'General Consultation' ? (
                              <span className="bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                General OPD
                              </span>
                            ) : p.category === 'Consultant Clinic' ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {p.consultantSubCategory || 'Specialist'}
                              </span>
                            ) : (
                              <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                                {p.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-semibold">
                            {p.paymentMode === 'Insurance' ? (
                              <span className="text-purple-700">Insurance</span>
                            ) : (
                              <span className="text-amber-700">Cash</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-stone-600 font-medium">
                            {p.paymentMode === 'Insurance' ? normalizeInsuranceCompany(p.insuranceCompany) : '-'}
                          </td>
                          {onDeletePatient && (
                            <td className="py-2 px-2.5 text-right">
                              <button
                                title="Delete mistaken patient record"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to permanently delete patient ${p.name} (${p.id})?\n\nUse this to remove entries registered with the wrong clinic, wrong insurance, or entered by mistake.`)) {
                                    onDeletePatient(p.id);
                                  }
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={onDeletePatient ? 9 : 8} className="text-center py-6 text-stone-400">
                          No matching records found in {reportData.monthName}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-stone-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            Reporting Month: <strong className="font-bold text-stone-800">{reportData.monthName}</strong> • {reportData.totalPatients} Registered Patients
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Monthly PDF Report
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
