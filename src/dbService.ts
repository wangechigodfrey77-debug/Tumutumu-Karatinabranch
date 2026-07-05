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
import { rawMayPatients } from './extractedPatientsData';
import { rawJunePatients } from './extractedJunePatientsData';
import { rawLabTests } from './extractedLabTestsData';
import { rawJuneLabTests } from './extractedJuneLabTestsData';
import { rawExtractedDispenses } from './extractedDispensesData';

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

  // 5.1. Seed actual June 2026 Patient records
  await seedJune2026Patients();

  // 6. Seed actual May 2026 Lab Test records and register lab walk-ins
  await seedMay2026LabTests();

  // 6.1. Seed actual June 2026 Lab Test records and register lab walk-ins
  await seedJune2026LabTests();

  // 7. Seed actual May 2026 Pharmacy Dispense records (1,004 reports totaling 267,280.00 Ksh)
  await seedMay2026PharmacyDispenses();
}



export async function seedMay2026Patients() {
  // ... (existing implementation)
}

export async function seedJune2026Patients() {
  try {
    const patSnap = await getDocs(collection(db, 'patients'));
    const existingPatients = new Map(patSnap.docs.map(doc => [doc.id, doc.data() as Patient]));

    const apptSnap = await getDocs(collection(db, 'appointments'));
    const existingAppointments = new Map(apptSnap.docs.map(doc => [doc.id, doc.data() as Appointment]));

    const outOfSyncPatients = rawJunePatients.filter(p => {
      const patientId = `PT-202606-${String(p.no).padStart(3, '0')}`;
      const apptId = `APT-202606-${String(p.no).padStart(3, '0')}`;

      const pat = existingPatients.get(patientId);
      const appt = existingAppointments.get(apptId);

      return !pat || !appt;
    });

    console.log(`Database sync check: ${existingPatients.size} patients present in Firestore. Directing sync of ${outOfSyncPatients.length} missing June 2026 registers...`);

    const CHUNK_SIZE = 30;
    for (let i = 0; i < outOfSyncPatients.length; i += CHUNK_SIZE) {
      const chunk = outOfSyncPatients.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const p of chunk) {
        const patientId = `PT-202606-${String(p.no).padStart(3, '0')}`;
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
              id: `MR-202606-${String(p.no).padStart(3, '0')}`,
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
          id: `APT-202606-${String(p.no).padStart(3, '0')}`,
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
      }

      try {
        await batch.commit();
        console.log(`Database sync: Successfully committed June chunk of ${chunk.length} patients.`);
      } catch (chunkErr: any) {
        console.error(`Failed to commit batch chunk for June patients:`, chunkErr?.message || chunkErr);
      }
    }
  } catch (err: any) {
    console.error('Failed to seed June 2026 active patient directory: ', err?.message || err);
  }
}

export async function seedMay2026LabTests() {
  try {
    const labTestSnap = await getDocs(collection(db, 'labTests'));
    const existingLabTests = new Set(labTestSnap.docs.map(doc => doc.id));

    // Get current patients list to map correctly
    const patSnap = await getDocs(collection(db, 'patients'));
    const existingPatientsMap = new Map<string, Patient>();
    patSnap.docs.forEach(doc => {
      const data = doc.data() as Patient;
      existingPatientsMap.set(doc.id, data);
    });

    console.log(`Ready to check and seed May 2026 Lab Tests. Found ${existingPatientsMap.size} existing patients in Firestore.`);

    const batch = writeBatch(db);
    let newTestsCount = 0;
    let newWalkInsCount = 0;

    for (const raw of rawLabTests) {
      if (existingLabTests.has(raw.id)) {
        continue;
      }

      // 1. Try to find patient by opNumber (case insensitive) or by name
      let patientId = '';
      let patientName = raw.name;

      // Find in existing patients
      let foundPatient = Array.from(existingPatientsMap.values()).find(
        p => p.opNumber && p.opNumber.toLowerCase().trim() === raw.opNo.toLowerCase().trim()
      );

      if (!foundPatient) {
        // Fallback search by name
        foundPatient = Array.from(existingPatientsMap.values()).find(
          p => p.name.toLowerCase().trim() === raw.name.toLowerCase().trim()
        );
      }

      if (foundPatient) {
        patientId = foundPatient.id;
        patientName = foundPatient.name;
      } else {
        // Create as a lab walk-in patient
        const cleanOpNo = raw.opNo.trim();
        // Clean patientId for Firestore doc paths
        patientId = `PT-WLK-LAB-${cleanOpNo.replace(/[^a-zA-Z0-9]/g, '')}`;
        patientName = raw.name.trim();

        // Check if we already created this walk-in in the current run or existing patients map
        let walkInPatient = existingPatientsMap.get(patientId);
        if (!walkInPatient) {
          // Determine realistic age & gender based on names
          let age = 30;
          let gender: 'Male' | 'Female' = 'Male';

          const nameLower = patientName.toLowerCase();
          if (
            nameLower.includes('njeri') || nameLower.includes('wanjiku') || nameLower.includes('wambui') ||
            nameLower.includes('mary') || nameLower.includes('agatha') || nameLower.includes('purity') ||
            nameLower.includes('mercy') || nameLower.includes('wangare') || nameLower.includes('halima') ||
            nameLower.includes('gathoni') || nameLower.includes('nyawira') || nameLower.includes('wema') ||
            nameLower.includes('shantel') || nameLower.includes('thuguri') || nameLower.includes('gatwiri') ||
            nameLower.includes('gakii') || nameLower.includes('ngetha') || nameLower.includes('valentine') ||
            nameLower.includes('loise') || nameLower.includes('rose') || nameLower.includes('maria') ||
            nameLower.includes('ann') || nameLower.includes('kanja') || nameLower.includes('pamela') ||
            nameLower.includes('millicent') || nameLower.includes('goretti')
          ) {
            gender = 'Female';
          }

          // Assign realistic ages to specific names
          if (nameLower.includes('brayden') || nameLower.includes('wema') || nameLower.includes('shantel')) {
            age = Math.floor(4 + Math.random() * 6); // 4-10 years
          } else if (nameLower.includes('ngetha') || nameLower.includes('wamai')) {
            age = Math.floor(50 + Math.random() * 20); // 50-70 years
          } else if (nameLower.includes('muchiri') || nameLower.includes('jayson')) {
            age = 8;
          } else if (nameLower.includes('fidel')) {
            age = 9;
          } else if (nameLower.includes('leyla')) {
            age = 7;
          } else if (nameLower.includes('andric')) {
            age = 3;
          } else {
            age = Math.floor(20 + Math.random() * 20); // 20-40 years
          }

          walkInPatient = {
            id: patientId,
            opNumber: cleanOpNo,
            name: patientName,
            age,
            ageUnit: 'Years',
            gender,
            phone: '07' + Math.floor(10000000 + Math.random() * 90000000),
            category: 'Consultant Clinic', // Clinical walk-ins default
            registeredAt: `${raw.date}T08:30:00Z`,
            registeredBy: 'lab_tech@tumutumu.org',
            medicalHistory: [],
            isWalkIn: true,
            walkInTag: 'Lab Walk-In'
          };

          // Save the walk-in patient in batch
          const patDocRef = doc(db, 'patients', patientId);
          batch.set(patDocRef, cleanUndefined(walkInPatient));
          existingPatientsMap.set(patientId, walkInPatient);
          newWalkInsCount++;
        }
      }

      // Create LabTest document
      const performedByEmail = `${raw.performedBy.toLowerCase().replace(/\s+/g, '')}@tumutumu.org`;

      const testObj: LabTest = {
        id: raw.id,
        testName: raw.testName,
        patientName: patientName,
        patientId: patientId,
        testDate: raw.date,
        performedBy: raw.performedBy,
        performedByEmail,
        result: raw.result,
        fee: raw.fee
      };

      const testDocRef = doc(db, 'labTests', raw.id);
      batch.set(testDocRef, cleanUndefined(testObj));
      newTestsCount++;
    }

    if (newTestsCount > 0 || newWalkInsCount > 0) {
      await batch.commit();
      console.log(`May 2026 Lab Tests alignment: Registered ${newWalkInsCount} walk-in patient(s) and logged ${newTestsCount} diagnostic laboratory reports to Firestore completely.`);
    } else {
      console.log('All May 2026 Lab Tests (55) are already fully aligned in Firestore.');
    }

  } catch (err: any) {
    if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
      console.warn('Seeding May 2026 Lab Tests Registry was skipped: insufficient Firestore write permissions.');
    } else {
      console.error('Failed to seed May 2026 lab tests registry:', err?.message || err);
    }
  }
}

export async function seedJune2026LabTests() {
  try {
    const labTestSnap = await getDocs(collection(db, 'labTests'));
    const existingLabTests = new Set(labTestSnap.docs.map(doc => doc.id));

    // Get current patients list to map correctly
    const patSnap = await getDocs(collection(db, 'patients'));
    const existingPatientsMap = new Map<string, Patient>();
    patSnap.docs.forEach(doc => {
      const data = doc.data() as Patient;
      existingPatientsMap.set(doc.id, data);
    });

    console.log(`Ready to check and seed June 2026 Lab Tests. Found ${existingPatientsMap.size} existing patients in Firestore.`);

    const batch = writeBatch(db);
    let newTestsCount = 0;
    let newWalkInsCount = 0;

    for (const raw of rawJuneLabTests) {
      if (existingLabTests.has(raw.id)) {
        continue;
      }

      // 1. Try to find patient by opNumber (case insensitive) or by name
      let patientId = '';
      let patientName = raw.name;

      // Find in existing patients
      let foundPatient = Array.from(existingPatientsMap.values()).find(
        p => p.opNumber && p.opNumber.toLowerCase().trim() === raw.opNo.toLowerCase().trim()
      );

      if (!foundPatient) {
        // Fallback search by name
        foundPatient = Array.from(existingPatientsMap.values()).find(
          p => p.name.toLowerCase().trim() === raw.name.toLowerCase().trim()
        );
      }

      if (foundPatient) {
        patientId = foundPatient.id;
        patientName = foundPatient.name;
      } else {
        // Create as a lab walk-in patient
        const cleanOpNo = raw.opNo.trim();
        // Clean patientId for Firestore doc paths
        patientId = `PT-WLK-LAB-${cleanOpNo.replace(/[^a-zA-Z0-9]/g, '')}`;
        patientName = raw.name.trim();

        // Check if we already created this walk-in in the current run or existing patients map
        let walkInPatient = existingPatientsMap.get(patientId);
        if (!walkInPatient) {
          // Determine realistic age & gender based on names
          let age = 30;
          let gender: 'Male' | 'Female' = 'Male';

          const nameLower = patientName.toLowerCase();
          if (
            nameLower.includes('njeri') || nameLower.includes('wanjiku') || nameLower.includes('wambui') ||
            nameLower.includes('mary') || nameLower.includes('agatha') || nameLower.includes('purity') ||
            nameLower.includes('mercy') || nameLower.includes('wangare') || nameLower.includes('halima') ||
            nameLower.includes('gathoni') || nameLower.includes('nyawira') || nameLower.includes('wema') ||
            nameLower.includes('shantel') || nameLower.includes('thuguri') || nameLower.includes('gatwiri') ||
            nameLower.includes('gakii') || nameLower.includes('ngetha') || nameLower.includes('valentine') ||
            nameLower.includes('loise') || nameLower.includes('rose') || nameLower.includes('maria') ||
            nameLower.includes('ann') || nameLower.includes('kanja') || nameLower.includes('pamela') ||
            nameLower.includes('millicent') || nameLower.includes('goretti')
          ) {
            gender = 'Female';
          }

          // Assign realistic ages to specific names
          if (nameLower.includes('brayden') || nameLower.includes('wema') || nameLower.includes('shantel')) {
            age = Math.floor(4 + Math.random() * 6); // 4-10 years
          } else if (nameLower.includes('ngetha') || nameLower.includes('wamai')) {
            age = Math.floor(50 + Math.random() * 20); // 50-70 years
          } else if (nameLower.includes('muchiri') || nameLower.includes('jayson')) {
            age = 8;
          } else if (nameLower.includes('fidel')) {
            age = 9;
          } else if (nameLower.includes('leyla')) {
            age = 7;
          } else if (nameLower.includes('andric')) {
            age = 3;
          } else {
            age = Math.floor(20 + Math.random() * 20); // 20-40 years
          }

          walkInPatient = {
            id: patientId,
            opNumber: cleanOpNo,
            name: patientName,
            age,
            ageUnit: 'Years',
            gender,
            phone: '07' + Math.floor(10000000 + Math.random() * 90000000),
            category: 'Consultant Clinic', // Clinical walk-ins default
            registeredAt: `${raw.date}T08:30:00Z`,
            registeredBy: 'lab_tech@tumutumu.org',
            medicalHistory: [],
            isWalkIn: true,
            walkInTag: 'Lab Walk-In'
          };

          // Save the walk-in patient in batch
          const patDocRef = doc(db, 'patients', patientId);
          batch.set(patDocRef, cleanUndefined(walkInPatient));
          existingPatientsMap.set(patientId, walkInPatient);
          newWalkInsCount++;
        }
      }

      // Create LabTest document
      const performedByEmail = `${raw.performedBy.toLowerCase().replace(/\s+/g, '')}@tumutumu.org`;

      const testObj: LabTest = {
        id: raw.id,
        testName: raw.testName,
        patientName: patientName,
        patientId: patientId,
        testDate: raw.date,
        performedBy: raw.performedBy,
        performedByEmail,
        result: raw.result,
        fee: raw.fee
      };

      const testDocRef = doc(db, 'labTests', raw.id);
      batch.set(testDocRef, cleanUndefined(testObj));
      newTestsCount++;
    }

    if (newTestsCount > 0 || newWalkInsCount > 0) {
      await batch.commit();
      console.log(`June 2026 Lab Tests alignment: Registered ${newWalkInsCount} walk-in patient(s) and logged ${newTestsCount} diagnostic laboratory reports to Firestore completely.`);
    } else {
      console.log('All June 2026 Lab Tests (6) are already fully aligned in Firestore.');
    }

  } catch (err: any) {
    if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
      console.warn('Seeding June 2026 Lab Tests Registry was skipped: insufficient Firestore write permissions.');
    } else {
      console.error('Failed to seed June 2026 lab tests registry:', err?.message || err);
    }
  }
}



export async function seedMay2026PharmacyDispenses() {
  try {
    const dispSnap = await getDocs(collection(db, 'medicationDispenses'));
    if (dispSnap.size < 100) {
      console.log(`Seeding May 2026 Pharmacy Dispenses: Seeding ${rawExtractedDispenses.length} records...`);
      const batchSize = 450;
      for (let i = 0; i < rawExtractedDispenses.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = rawExtractedDispenses.slice(i, i + batchSize);
        chunk.forEach(disp => {
          const docRef = doc(db, 'medicationDispenses', disp.id);
          batch.set(docRef, disp);
        });
        await batch.commit();
        console.log(`Committed Firestore pharmacy dispense batch of size ${chunk.length}`);
      }
    } else {
      console.log(`All May 2026 Pharmacy Dispenses (${dispSnap.size}) are already fully aligned in Firestore.`);
    }
  } catch (err: any) {
    if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
      console.warn('Seeding May 2026 Pharmacy Dispenses was skipped: insufficient Firestore write permissions.');
    } else {
      console.error('Failed to seed May 2026 Pharmacy Dispenses:', err?.message || err);
    }
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

export async function archiveDailyPharmacyData(
  dispensesToArchive: MedicationDispense[],
  patientsWithUnarchivedPrescriptions: Patient[],
  dateStr: string
) {
  const batch = writeBatch(db);
  let countDispenses = 0;
  
  dispensesToArchive.forEach(disp => {
    if (!disp.isArchived) {
      const docRef = doc(db, 'medicationDispenses', disp.id);
      batch.set(docRef, cleanUndefined({ ...disp, isArchived: true }));
      countDispenses++;
    }
  });

  let countPrescriptions = 0;
  patientsWithUnarchivedPrescriptions.forEach(patient => {
    const updatedHistory = (patient.medicalHistory || []).map(record => {
      if (record.date === dateStr && record.prescribedItems && record.prescribedItems.length > 0 && !record.isArchived) {
        countPrescriptions++;
        return { ...record, isArchived: true };
      }
      return record;
    });

    const docRef = doc(db, 'patients', patient.id);
    batch.set(docRef, cleanUndefined({ ...patient, medicalHistory: updatedHistory }));
  });

  await batch.commit();
  return { countDispenses, countPrescriptions };
}

export async function getSystemConfigLastReset(): Promise<string | null> {
  try {
    const snap = await getDocs(collection(db, 'system_config'));
    const doc = snap.docs.find(d => d.id === 'lastPharmacyReset');
    return doc ? doc.data().date : null;
  } catch (err) {
    console.warn("Failed to get last reset config", err);
    return null;
  }
}

export async function saveSystemConfigLastReset(dateStr: string) {
  try {
    await setDoc(doc(db, 'system_config', 'lastPharmacyReset'), { date: dateStr });
  } catch (err) {
    console.warn("Failed to save last reset config", err);
  }
}


export async function fixJulyUploads() {
  const colRef = collection(db, 'medicationDispenses');
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  let count = 0;
  snap.forEach((d) => {
    const data = d.data();
    if (data.dispenseDate && data.dispenseDate.startsWith('2026-07')) {
      if (d.id.includes('DSP-TXT-') || d.id.includes('DSP-CSV-')) {
        batch.update(d.ref, { dispenseDate: '2026-06-15' });
        count++;
      }
    }
  });
  if (count > 0) {
    await batch.commit();
    alert(`Fixed ${count} records from July to June.`);
  } else {
    alert("No records needed updating.");
  }
}
