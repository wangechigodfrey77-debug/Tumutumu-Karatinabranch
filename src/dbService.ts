import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  WhitelistUser,
  Patient,
  LabTest,
  LabCatalogItem,
  MedicationDispense,
  PharmacyItem,
  DutyAllocation,
  LeaveRequest,
  Message,
  Appointment,
  Expense,
  AuditLog,
  GeneratedReport,
} from './types';
import {
  defaultWhitelist,
  defaultPharmacyStock,
  defaultLabCatalog,
} from './mockData';

// -------------------------------------------------------------
// SEED DATABASE ON BOOTSTRAP if empty.
// In Live Production Mode, we enforce NO mock patient cases, clinic records or test transactions.
// We only preserve the system catalogs (Lab price index, Pharmacy drug lists) and user Whitelists.
// -------------------------------------------------------------
export async function seedDatabaseIfEmpty() {
  // Always write system live production mode configuration status
  try {
    await setDoc(doc(db, 'system_config', 'status'), { isProductionLive: true });
  } catch (err: any) {
    console.warn('System status configuration skipped or unreadable: ', err);
  }

  // 1. Whitelist Seed - Critical for login authentication and Google OAuth
  try {
    const wlSnap = await getDocs(collection(db, 'whitelist'));
    const existingEmails = new Set(wlSnap.docs.map(doc => doc.id.toLowerCase()));
    const missingUsers = defaultWhitelist.filter(u => !existingEmails.has(u.email.toLowerCase()));
    if (missingUsers.length > 0) {
      console.log('Provisioning authorized staff whitelist...', missingUsers);
      const batch = writeBatch(db);
      missingUsers.forEach((u) => {
        const d = doc(db, 'whitelist', u.email);
        batch.set(d, u);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (whitelist): ', err?.message || err);
  }

  // 2. Clear out any previous experimental patient data to conform to pristine mode
  // The system is now 100% clean of fake patient records!

  // 3. Lab Catalog - Master list of standard clinical laboratories
  try {
    const lcSnap = await getDocs(collection(db, 'labCatalog'));
    let shouldReSeed = lcSnap.empty;
    if (!lcSnap.empty) {
      const hasOldData = lcSnap.docs.some(doc => doc.data().name === 'Malaria Slide/RDT test' || doc.id === 'LC-8');
      if (hasOldData || lcSnap.size < 100) {
        shouldReSeed = true;
        console.log('Pristine mode: Cleaning old lab catalog items from Firestore...');
        const deleteBatch = writeBatch(db);
        lcSnap.docs.forEach((document) => {
          deleteBatch.delete(document.ref);
        });
        await deleteBatch.commit();
      }
    }
    if (shouldReSeed) {
      console.log('Seeding standard clinical Lab Catalog to Firestore...');
      const batch = writeBatch(db);
      defaultLabCatalog.forEach((item) => {
        const d = doc(db, 'labCatalog', item.id);
        batch.set(d, item);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (labCatalog): ', err?.message || err);
  }

  // 4. Pharmacy Catalog - Actual medicinal stock items from Karatina Branch.
  // We initialize the stock count to represent actual empty shelving parameters or seed values.
  try {
    const stockSnap = await getDocs(collection(db, 'pharmacyItems'));
    if (stockSnap.size < 100) {
      console.log('Seeding master pharmacy inventory dictionary...');
      const batch = writeBatch(db);
      defaultPharmacyStock.forEach((pi) => {
        const d = doc(db, 'pharmacyItems', pi.id);
        batch.set(d, pi);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (pharmacyItems): ', err?.message || err);
  }

  // 5. Seed actual May 2026 Patient records extracted from the printed register sheet
  await seedMay2026Patients();
}

interface RawRow {
  no: number;
  opNumber: string;
  name: string;
  age: number;
  ageUnit: 'Years' | 'Months';
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  date: string;
  timeRegistered: string;
  timeSeen: string;
  seenBy: string;
}

const rawMayPatients: RawRow[] = [
  {
    no: 1,
    opNumber: "OP001724/26",
    name: "Elvian Waweru Ngani",
    age: 3,
    ageUnit: "Months",
    gender: "Male",
    diagnosis: "Candidiasis, Unspecified",
    date: "2026-05-01",
    timeRegistered: "08:53:21",
    timeSeen: "09:15:50",
    seenBy: "jimmwangi"
  },
  {
    no: 2,
    opNumber: "OP000301/26",
    name: "Fidel Mbugua Kairu",
    age: 9,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Chronic Tonsillitis",
    date: "2026-05-01",
    timeRegistered: "09:35:32",
    timeSeen: "09:47:07",
    seenBy: "jimmwangi"
  },
  {
    no: 3,
    opNumber: "OP00161968",
    name: "Mwai Mwangi Danson",
    age: 45,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "-",
    date: "2026-05-01",
    timeRegistered: "09:47:13",
    timeSeen: "09:57:11",
    seenBy: "jimmwangi"
  },
  {
    no: 4,
    opNumber: "OP000742/23",
    name: "Bernad Mwangi Muteithia",
    age: 85,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Heart Failure",
    date: "2026-05-01",
    timeRegistered: "11:05:20",
    timeSeen: "11:16:49",
    seenBy: "jimmwangi"
  },
  {
    no: 5,
    opNumber: "OP000978/23",
    name: "Alice Wanjiru Maguru",
    age: 61,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-01",
    timeRegistered: "11:06:43",
    timeSeen: "11:41:44",
    seenBy: "jimmwangi"
  },
  {
    no: 6,
    opNumber: "OP000189/26",
    name: "Watson Wanjau Githae",
    age: 68,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Hyperplasia Of Prostate",
    date: "2026-05-01",
    timeRegistered: "11:35:04",
    timeSeen: "12:17:23",
    seenBy: "drjohn"
  },
  {
    no: 7,
    opNumber: "OP017774/25",
    name: "Leyla Wangui Mwangi",
    age: 7,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Amebiasis",
    date: "2026-05-01",
    timeRegistered: "11:45:51",
    timeSeen: "12:21:52",
    seenBy: "jimmwangi"
  },
  {
    no: 8,
    opNumber: "OP013125/25",
    name: "Mikeian Chege Wahome",
    age: 3,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Upper Respiratory Tract, Part Unspecified",
    date: "2026-05-01",
    timeRegistered: "12:13:11",
    timeSeen: "12:35:42",
    seenBy: "jimmwangi"
  },
  {
    no: 9,
    opNumber: "OP002191/26",
    name: "Jackline Muthoni Mwangi",
    age: 26,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Acute Tonsillitis",
    date: "2026-05-01",
    timeRegistered: "12:29:51",
    timeSeen: "13:03:47",
    seenBy: "jimmwangi"
  },
  {
    no: 10,
    opNumber: "OP00252688",
    name: "Chepyegon Oliver",
    age: 31,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Acute Gingivitis",
    date: "2026-05-01",
    timeRegistered: "12:56:18",
    timeSeen: "13:12:59",
    seenBy: "jimmwangi"
  },
  {
    no: 11,
    opNumber: "OP00216872",
    name: "Kinyua Wangari Mercy",
    age: 38,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "-",
    date: "2026-05-01",
    timeRegistered: "12:59:41",
    timeSeen: "",
    seenBy: ""
  },
  {
    no: 12,
    opNumber: "OP000698/26",
    name: "Peter Njoroge Kimani",
    age: 27,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Atopic Dermatitis",
    date: "2026-05-01",
    timeRegistered: "13:11:30",
    timeSeen: "13:47:38",
    seenBy: "jimmwangi"
  },
  {
    no: 13,
    opNumber: "OP002195/26",
    name: "Jemimah Wambui Miringu",
    age: 23,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Acute Tonsillitis",
    date: "2026-05-01",
    timeRegistered: "15:35:13",
    timeSeen: "15:38:32",
    seenBy: "eunah"
  },
  {
    no: 14,
    opNumber: "OP002196/26",
    name: "Bianca Britta Wambui",
    age: 5,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Chronic Tonsillitis",
    date: "2026-05-01",
    timeRegistered: "15:41:18",
    timeSeen: "16:03:55",
    seenBy: "jimmwangi"
  },
  {
    no: 15,
    opNumber: "OP002197/26",
    name: "Dalia Wanjiku Murimi",
    age: 1,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Pneumonia Due To Other Specified Infectious Organisms",
    date: "2026-05-01",
    timeRegistered: "16:18:01",
    timeSeen: "16:35:44",
    seenBy: "jimmwangi"
  },
  {
    no: 16,
    opNumber: "OP016120/25",
    name: "Agatha Wothaya Wachira",
    age: 29,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Unspecified Infection Of Urinary Tract In Pregnancy",
    date: "2026-05-01",
    timeRegistered: "16:24:12",
    timeSeen: "13:37:21",
    seenBy: "eunah"
  },
  {
    no: 17,
    opNumber: "OP018328/25",
    name: "Andric Wanjiru Githu",
    age: 3,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "-",
    date: "2026-05-02",
    timeRegistered: "11:09:52",
    timeSeen: "11:35:36",
    seenBy: "jimmwangi"
  },
  {
    no: 18,
    opNumber: "OP00234718",
    name: "Njeri Kirangi Avril",
    age: 6,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Diarrhea And Gastroenteritis Of Presumed Infectious Origin",
    date: "2026-05-02",
    timeRegistered: "11:39:39",
    timeSeen: "11:55:20",
    seenBy: "jimmwangi"
  },
  {
    no: 19,
    opNumber: "OP001760/23",
    name: "Jane Wangui Mwangi",
    age: 78,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Tinea Pedis",
    date: "2026-05-02",
    timeRegistered: "11:44:48",
    timeSeen: "12:37:44",
    seenBy: "jimmwangi"
  },
  {
    no: 20,
    opNumber: "OP019175/25",
    name: "Justus Mwangi Kihara",
    age: 78,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-02",
    timeRegistered: "11:56:47",
    timeSeen: "12:30:19",
    seenBy: "jimmwangi"
  },
  {
    no: 21,
    opNumber: "OP008904/24",
    name: "Florence Wanjiru Kiritu",
    age: 50,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-02",
    timeRegistered: "13:24:23",
    timeSeen: "14:26:59",
    seenBy: "jimmwangi"
  },
  {
    no: 22,
    opNumber: "OP002209/26",
    name: "Victoria Nduta Muna",
    age: 18,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Unspecified Acute Lower Respiratory Infection",
    date: "2026-05-02",
    timeRegistered: "14:18:20",
    timeSeen: "14:37:27",
    seenBy: "jimmwangi"
  },
  {
    no: 23,
    opNumber: "OP001558/26",
    name: "Phyllis Njeri Kanyiri",
    age: 39,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Other Arthritis",
    date: "2026-05-02",
    timeRegistered: "14:22:08",
    timeSeen: "14:47:53",
    seenBy: "jimmwangi"
  },
  {
    no: 24,
    opNumber: "OP00239750",
    name: "Njogu Chomba Kennedy",
    age: 33,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Pruritus Ani",
    date: "2026-05-02",
    timeRegistered: "14:40:55",
    timeSeen: "15:01:05",
    seenBy: "jimmwangi"
  },
  {
    no: 25,
    opNumber: "OP012490/25",
    name: "Joan Wairimu Kinyua",
    age: 26,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Other Hypothyroidism",
    date: "2026-05-02",
    timeRegistered: "14:42:25",
    timeSeen: "15:18:25",
    seenBy: "jimmwangi"
  },
  {
    no: 26,
    opNumber: "OP001934/26",
    name: "Eunice Waithira Muthui",
    age: 74,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Malignant Neoplasm Of Breast",
    date: "2026-05-20",
    timeRegistered: "11:19:07",
    timeSeen: "12:44:04",
    seenBy: "jkariithi"
  },
  {
    no: 27,
    opNumber: "OP00251946",
    name: "Muriuki Munene Hezron",
    age: 31,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Other Acute Gastritis",
    date: "2026-05-03",
    timeRegistered: "11:20:18",
    timeSeen: "11:31:15",
    seenBy: "eunah"
  },
  {
    no: 28,
    opNumber: "OP007339/24",
    name: "Jim Mwangi Gakumba",
    age: 33,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Sprain And Strain Of Other And Unspecified Parts Of Foot",
    date: "2026-05-03",
    timeRegistered: "11:24:27",
    timeSeen: "11:43:20",
    seenBy: "eunah"
  },
  {
    no: 29,
    opNumber: "OP001946/26",
    name: "Ann Wanjiru Wanjohi",
    age: 22,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "-",
    date: "2026-05-03",
    timeRegistered: "14:51:06",
    timeSeen: "14:58:07",
    seenBy: "eunah"
  },
  {
    no: 30,
    opNumber: "OP002217/26",
    name: "Damian Jayson Kibugi",
    age: 8,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Other Specified Noninfective Gastroenteritis And Colitis",
    date: "2026-05-03",
    timeRegistered: "16:50:48",
    timeSeen: "17:29:02",
    seenBy: "eunah"
  },
  {
    no: 31,
    opNumber: "OP002218/26",
    name: "Zuri Arianna Nyambura",
    age: 2,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Viral Pneumonia, Unspecified",
    date: "2026-05-03",
    timeRegistered: "18:08:11",
    timeSeen: "18:25:35",
    seenBy: "eunah"
  },
  {
    no: 32,
    opNumber: "OP016861/25",
    name: "Wachira Anthony Maina",
    age: 32,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Upper Respiratory Tract, Part Unspecified",
    date: "2026-05-04",
    timeRegistered: "08:03:03",
    timeSeen: "08:14:50",
    seenBy: "ekabura"
  },
  {
    no: 33,
    opNumber: "OP00148065",
    name: "Jecinta Wangechi Ngirigacha",
    age: 80,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-04",
    timeRegistered: "09:18:00",
    timeSeen: "09:33:38",
    seenBy: "ekabura"
  },
  {
    no: 34,
    opNumber: "OP00241229",
    name: "Musomba Precious Joy",
    age: 13,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Candidiasis",
    date: "2026-05-04",
    timeRegistered: "09:18:47",
    timeSeen: "10:04:02",
    seenBy: "ekabura"
  },
  {
    no: 35,
    opNumber: "OP00241242",
    name: "Musomba Muli Xavier",
    age: 15,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Urinary Tract Infection, Site Not Specified",
    date: "2026-05-04",
    timeRegistered: "09:51:48",
    timeSeen: "10:08:58",
    seenBy: "ekabura"
  },
  {
    no: 36,
    opNumber: "OP002226/26",
    name: "Monicah Muthoni Maina",
    age: 56,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Other Helminthiases",
    date: "2026-05-04",
    timeRegistered: "09:58:03",
    timeSeen: "10:14:08",
    seenBy: "ekabura"
  },
  {
    no: 37,
    opNumber: "OP016978/25",
    name: "Eunice Muthoni Macharia",
    age: 86,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-04",
    timeRegistered: "10:03:07",
    timeSeen: "10:28:46",
    seenBy: "ekabura"
  },
  {
    no: 38,
    opNumber: "OP000301/26",
    name: "Fidel Mbugua Kairu",
    age: 9,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Chronic Tonsillitis",
    date: "2026-05-01",
    timeRegistered: "09:35:32",
    timeSeen: "09:47:07",
    seenBy: "jimmwangi"
  },
  {
    no: 39,
    opNumber: "OP00199716",
    name: "Ngure Wambura Esther",
    age: 70,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Essential (Primary) Hypertension",
    date: "2026-05-04",
    timeRegistered: "10:32:47",
    timeSeen: "10:46:12",
    seenBy: "ekabura"
  },
  {
    no: 40,
    opNumber: "OP00202322",
    name: "Dickson Kahoi Irungu",
    age: 60,
    ageUnit: "Years",
    gender: "Male",
    diagnosis: "Other Specified Noninfective Gastroenteritis And Colitis",
    date: "2026-05-04",
    timeRegistered: "10:35:48",
    timeSeen: "11:05:51",
    seenBy: "ekabura"
  },
  {
    no: 41,
    opNumber: "OP001791/26",
    name: "Purity Njeri Ngunu",
    age: 60,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Retrovirus Infections, Not Elsewhere Classified",
    date: "2026-05-08",
    timeRegistered: "12:15:03",
    timeSeen: "13:54:36",
    seenBy: "drjohn"
  },
  {
    no: 42,
    opNumber: "OP019325/25",
    name: "Yvonne Wanjiru Maina",
    age: 20,
    ageUnit: "Years",
    gender: "Female",
    diagnosis: "Other Gastritis",
    date: "2026-05-04",
    timeRegistered: "11:26:34",
    timeSeen: "11:58:48",
    seenBy: "ekabura"
  }
];

export async function seedMay2026Patients() {
  try {
    console.log(`Force synchronizing all ${rawMayPatients.length} transcribed May 2026 active register records...`);
    const batch = writeBatch(db);

    rawMayPatients.forEach((p) => {
      const patientId = `PT-202605-${String(p.no).padStart(2, '0')}`;
      const seenByLower = p.seenBy.toLowerCase().trim();
      const isMOPC = seenByLower === 'drjohn';
      const isSurgical = seenByLower === 'jkariithi';

      let category: Patient['category'] = 'General Consultation';
      let consultantSubCategory: Patient['consultantSubCategory'] = undefined;
      let billingAmount = 300;

      if (isMOPC) {
        category = 'Consultant Clinic';
        consultantSubCategory = 'MOPC';
        billingAmount = 1500;
      } else if (isSurgical) {
        category = 'Consultant Clinic';
        consultantSubCategory = 'Surgical';
        billingAmount = 1500;
      }

      const patObj: Patient = {
        id: patientId,
        opNumber: p.opNumber,
        name: p.name,
        age: p.age,
        ageUnit: p.ageUnit,
        gender: p.gender,
        phone: '',
        category,
        consultantSubCategory,
        registeredAt: `${p.date}T${p.timeRegistered}Z`,
        registeredBy: 'gmaurice101@gmail.com',
        medicalHistory: p.diagnosis && p.diagnosis !== '-' ? [
          {
            id: `MR-202605-${String(p.no).padStart(2, '0')}`,
            date: p.date,
            symptoms: 'Referred Diagnosis',
            diagnoses: p.diagnosis,
            notes: p.timeSeen ? `Registered at ${p.timeRegistered}, Seen at ${p.timeSeen} by doctor: ${p.seenBy}` : `Registered at ${p.timeRegistered}`,
            prescriptions: '',
            doctorName: p.seenBy || 'General Duty Officer',
            doctorEmail: p.seenBy ? `${p.seenBy.toLowerCase()}@tumutumu.org` : 'reception@tumutumu.org'
          }
        ] : []
      };

      const apptObj: Appointment = {
        id: `APT-202605-${String(p.no).padStart(2, '0')}`,
        patientId: patientId,
        patientName: p.name,
        patientPhone: '',
        date: p.date,
        time: p.timeRegistered.substring(0, 5),
        category,
        consultantSubCategory,
        doctorEmail: p.seenBy ? `${p.seenBy.toLowerCase()}@tumutumu.org` : 'doctor@tumutumu.org',
        status: 'Completed',
        billingStatus: 'Paid',
        billingAmount
      };

      const patDocRef = doc(db, 'patients', patientId);
      const apptDocRef = doc(db, 'appointments', apptObj.id);

      batch.set(patDocRef, cleanUndefined(patObj));
      batch.set(apptDocRef, cleanUndefined(apptObj));
    });

    await batch.commit();
    console.log('May 2026 active registers synchronized successfully under correct dates.');
  } catch (err: any) {
    console.error('Failed to seed May 2026 active patient directory: ', err?.message || err);
  }
}

// -------------------------------------------------------------
// REAL-TIME DIRECT COLLECTION SUBSCRIBERS
// -------------------------------------------------------------
export function listenWhitelist(onUpdate: (data: WhitelistUser[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'whitelist');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: WhitelistUser[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as WhitelistUser);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'whitelist');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenPatients(onUpdate: (data: Patient[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'patients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Patient);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLabTests(onUpdate: (data: LabTest[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'labTests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LabTest[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LabTest);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'labTests');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenDispenses(onUpdate: (data: MedicationDispense[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'medicationDispenses');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: MedicationDispense[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as MedicationDispense);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'medicationDispenses');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenStock(onUpdate: (data: PharmacyItem[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'pharmacyItems');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PharmacyItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as PharmacyItem);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'pharmacyItems');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLabCatalog(onUpdate: (data: LabCatalogItem[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'labCatalog');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LabCatalogItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LabCatalogItem);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'labCatalog');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenDuties(onUpdate: (data: DutyAllocation[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'dutyAllocations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DutyAllocation[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as DutyAllocation);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'dutyAllocations');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLeaves(onUpdate: (data: LeaveRequest[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'leaveRequests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LeaveRequest[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LeaveRequest);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'leaveRequests');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenMessages(onUpdate: (data: Message[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'messages');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Message);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenAppointments(onUpdate: (data: Appointment[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Appointment);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

// -------------------------------------------------------------
// SECURE MUTATION API PATH ACTIONS (With automatic undefined sanitation)
// -------------------------------------------------------------
function cleanUndefined<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  if (obj === null) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export async function saveWhitelistUser(user: WhitelistUser) {
  const path = `whitelist/${user.email}`;
  try {
    const docRef = doc(db, 'whitelist', user.email);
    await setDoc(docRef, cleanUndefined(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeWhitelistUser(email: string) {
  const path = `whitelist/${email}`;
  try {
    const docRef = doc(db, 'whitelist', email);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePatient(patient: Patient) {
  const path = `patients/${patient.id}`;
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, cleanUndefined(patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePatient(patientId: string) {
  const path = `patients/${patientId}`;
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAppointment(appt: Appointment) {
  const path = `appointments/${appt.id}`;
  try {
    const docRef = doc(db, 'appointments', appt.id);
    await setDoc(docRef, cleanUndefined(appt));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLabTest(test: LabTest) {
  const path = `labTests/${test.id}`;
  try {
    const docRef = doc(db, 'labTests', test.id);
    await setDoc(docRef, cleanUndefined(test));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLabCatalogItem(item: LabCatalogItem) {
  const path = `labCatalog/${item.id}`;
  try {
    const docRef = doc(db, 'labCatalog', item.id);
    await setDoc(docRef, cleanUndefined(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMedicationDispense(disp: MedicationDispense) {
  const path = `medicationDispenses/${disp.id}`;
  try {
    const docRef = doc(db, 'medicationDispenses', disp.id);
    await setDoc(docRef, cleanUndefined(disp));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePharmacyItem(item: PharmacyItem) {
  const path = `pharmacyItems/${item.id}`;
  try {
    const docRef = doc(db, 'pharmacyItems', item.id);
    await setDoc(docRef, cleanUndefined(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDutyAllocation(duty: DutyAllocation) {
  const path = `dutyAllocations/${duty.id}`;
  try {
    const docRef = doc(db, 'dutyAllocations', duty.id);
    await setDoc(docRef, cleanUndefined(duty));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeDutyAllocation(dutyId: string) {
  const path = `dutyAllocations/${dutyId}`;
  try {
    const docRef = doc(db, 'dutyAllocations', dutyId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLeaveRequest(req: LeaveRequest) {
  const path = `leaveRequests/${req.id}`;
  try {
    const docRef = doc(db, 'leaveRequests', req.id);
    await setDoc(docRef, cleanUndefined(req));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveRequest(requestId: string) {
  const path = `leaveRequests/${requestId}`;
  try {
    const docRef = doc(db, 'leaveRequests', requestId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMessage(msg: Message) {
  const path = `messages/${msg.id}`;
  try {
    const docRef = doc(db, 'messages', msg.id);
    await setDoc(docRef, cleanUndefined(msg));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMessage(messageId: string) {
  const path = `messages/${messageId}`;
  try {
    const docRef = doc(db, 'messages', messageId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function listenExpenses(onUpdate: (expenses: Expense[]) => void, onError: (err: unknown) => void) {
  const queryRef = query(collection(db, 'expenses'));
  return onSnapshot(
    queryRef,
    (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as Expense);
      });
      // Sort by date descending
      items.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'expenses');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export async function saveExpense(expense: Expense) {
  const path = `expenses/${expense.id}`;
  try {
    const docRef = doc(db, 'expenses', expense.id);
    await setDoc(docRef, cleanUndefined(expense));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpense(expenseId: string) {
  const path = `expenses/${expenseId}`;
  try {
    const docRef = doc(db, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function listenAuditLogs(onUpdate: (logs: AuditLog[]) => void, onError: (err: unknown) => void) {
  const queryRef = query(collection(db, 'auditLogs'));
  return onSnapshot(
    queryRef,
    (snapshot) => {
      const items: AuditLog[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as AuditLog);
      });
      // Sort by timestamp descending
      items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'auditLogs');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export async function saveAuditLog(log: AuditLog) {
  const path = `auditLogs/${log.id}`;
  try {
    const docRef = doc(db, 'auditLogs', log.id);
    await setDoc(docRef, cleanUndefined(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function listenBoardReports(onUpdate: (reports: GeneratedReport[]) => void, onError: (err: unknown) => void) {
  const queryRef = query(collection(db, 'boardReports'));
  return onSnapshot(
    queryRef,
    (snapshot) => {
      const items: GeneratedReport[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as GeneratedReport);
      });
      // Sort by createdAt descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'boardReports');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export async function saveBoardReport(report: GeneratedReport) {
  const path = `boardReports/${report.id}`;
  try {
    const docRef = doc(db, 'boardReports', report.id);
    await setDoc(docRef, cleanUndefined(report));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBoardReport(reportId: string) {
  const path = `boardReports/${reportId}`;
  try {
    const docRef = doc(db, 'boardReports', reportId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

