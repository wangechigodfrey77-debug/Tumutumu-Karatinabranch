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
}

/**
 * Cleanly sweeps all transactional operational entries out of the database,
 * preserving only the authorized system whitelist configuration status.
 */
export async function forceResetToPristineSeeds() {
  await clearAllTestDataToGoLive();
}

/**
 * Transitions the database to a completely blank Live Production state.
 * It deletes all existing patient, lab, appointment, supply, and expense records,
 * preserves only the authorized white list, and turns on the isProductionLive status flag.
 */
export async function clearAllTestDataToGoLive() {
  try {
    await setDoc(doc(db, 'system_config', 'status'), { isProductionLive: true });
    console.log('Production flag written to system_config/status');
  } catch (err: any) {
    console.error('Failed to set firestore production live mode: ', err?.message || err);
  }

  // Clear transactional/testing collections
  const collectionsToClear = [
    'patients',
    'labTests',
    'medicationDispenses',
    'dutyAllocations',
    'leaveRequests',
    'messages',
    'appointments',
    'expenses',
    'auditLogs',
    'boardReports'
  ];

  for (const name of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
        console.log(`Collection "${name}" cleared successfully.`);
      }
    } catch (err: any) {
      console.warn(`Error clearing collection "${name}": `, err?.message || err);
    }
  }

  // Ensure whitelist contains the default credentials so Admin can log in
  try {
    const wlSnap = await getDocs(collection(db, 'whitelist'));
    const existingEmails = new Set(wlSnap.docs.map(doc => doc.id.toLowerCase()));
    const missingUsers = defaultWhitelist.filter(u => !existingEmails.has(u.email.toLowerCase()));
    if (missingUsers.length > 0) {
      const batch = writeBatch(db);
      missingUsers.forEach((u) => {
        batch.set(doc(db, 'whitelist', u.email), u);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Error verifying whitelisted logs during cleanup: ', err?.message || err);
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

