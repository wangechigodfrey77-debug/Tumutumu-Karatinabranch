import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function wipe() {
  const colRef = collection(db, 'medicationDispenses');
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  let count = 0;
  
  snap.forEach((d) => {
    if (d.id.includes('DSP-TXT-')) {
      batch.delete(d.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Deleted ${count} TXT upload records`);
  } else {
    console.log("No TXT records found");
  }
}

wipe().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
