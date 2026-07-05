import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function fix() {
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
    console.log(`Updated ${count} records to June 2026`);
  } else {
    console.log("No records needed updating");
  }
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
