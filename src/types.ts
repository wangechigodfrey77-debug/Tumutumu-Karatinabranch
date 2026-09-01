/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Reception' | 'Doctor' | 'Lab' | 'Pharmacy' | 'Triage' | 'Supervisor';

export interface WhitelistUser {
  email: string;
  name: string;
  role: UserRole;
}

export interface PatientVitals {
  id: string;
  temperature: number; // in °C
  bpSystolic: number;  // in mmHg
  bpDiastolic: number; // in mmHg
  pulse: number;       // in bpm
  respRate?: number;   // breaths/min
  spo2?: number;       // %
  weight?: number;     // kg
  height?: number;     // cm
  bloodSugar?: number; // mmol/L
  urgency: 'Emergent' | 'Urgent' | 'Normal' | 'Routine';
  chiefComplaint: string;
  recordedAt: string;
  recordedBy: string;
  recordedByEmail: string;
}

export interface ImagingRequestItem {
  imagingId: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI';
  bodyPart: string;
  clinicalIndication?: string;
  urgency?: 'Routine' | 'Urgent' | 'Emergency';
  fee: number;
}

export interface MedicalRecord {
  id: string;
  date: string;
  symptoms: string;
  diagnoses: string;
  notes: string;
  prescriptions: string;
  doctorName: string;
  doctorEmail: string;
  prescribedItems?: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    dosage?: string;
  }[];
  labTestsRequested?: {
    testId: string;
    testName: string;
    fee: number;
  }[];
  imagingRequested?: ImagingRequestItem[];
  billingStatus?: 'Unpaid' | 'Paid' | 'Dispensed';
  invoiceAmount?: number;
  isArchived?: boolean;
}

export interface Patient {
  id: string;
  opNumber?: string;
  name: string;
  age: number;
  ageUnit?: 'Years' | 'Months';
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  category: 'General Consultation' | 'Consultant Clinic' | 'Walk-in Lab' | 'Walk-in Pharmacy' | 'Outpatient Procedure';
  consultantSubCategory?: 'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn';
  currentStatus?: 'Pending Triage' | 'Triage Complete' | 'With Doctor' | 'At Lab' | 'At Pharmacy' | 'Admitted' | 'Discharged' | string;
  registeredAt: string;
  registeredBy: string;
  medicalHistory: MedicalRecord[];
  isWalkIn?: boolean;
  walkInTag?: 'Lab Walk-In' | 'Pharmacy Walk-In' | 'Outpatient Procedure Walk-In';
  paymentMode?: 'Cash' | 'Insurance';
  insuranceCompany?: string;
  vitals?: PatientVitals;
  vitalsHistory?: PatientVitals[];
}

export interface LabCatalogItem {
  id: string;
  name: string;
  fee: number;
}

export interface LabTest {
  id: string;
  testName: string;
  patientName: string;
  patientId: string;
  testDate: string;
  performedBy: string;
  performedByEmail: string;
  result: string;
  fee: number;
  billingStatus?: 'Unpaid' | 'Paid' | 'Completed' | 'Dispensed';
  recordId?: string;
  requestedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface MedicationDispense {
  id: string;
  medicationName: string;
  patientName: string;
  patientId: string;
  dispenseDate: string;
  dispensedBy: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  isArchived?: boolean;
  dispensedAt?: string;
  createdAt?: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  stockQuantity: number;
  price: number;
  category: string;
  minThreshold?: number;
}

export interface DutyAllocation {
  id: string;
  staffEmail: string;
  staffName: string;
  role: UserRole;
  shift: 'Day Shift' | 'Night Shift' | 'On Call';
  department: 'Reception' | 'Lab' | 'Pharmacy' | 'Clinical' | 'Admin';
  date: string;
}

export interface LeaveRequest {
  id: string;
  staffEmail: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
}

export interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  senderRole: string;
  recipientEmail: string; // e.g., 'all-staff' or a specific email
  subject: string;
  content: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  category: 'General Consultation' | 'Consultant Clinic' | 'Walk-in Lab' | 'Walk-in Pharmacy' | 'Outpatient Procedure';
  consultantSubCategory?: 'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn';
  doctorEmail?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  billingStatus: 'Unpaid' | 'Paid';
  billingAmount: number;
  paymentMode?: 'Cash' | 'Insurance';
  insuranceCompany?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  category: 'Electricity' | 'Water' | 'Security' | 'Other' | string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface GeneratedReport {
  id: string;
  createdAt: string;
  content: string;
  patientCount: number;
  totalRevenue: number;
}



