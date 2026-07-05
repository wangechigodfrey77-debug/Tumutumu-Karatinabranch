import { collection, addDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { db } from '../src/firebase';

async function uploadPrescriptions() {
  const filePath = path.join(process.cwd(), 'src/data/june_prescriptions.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const rawExtractedDispenses = JSON.parse(rawData);
  const collectionRef = collection(db, 'medicationDispenses');
  
  for (const dispense of rawExtractedDispenses) {
    try {
      await addDoc(collectionRef, dispense);
      console.log(`Uploaded dispense for ${dispense.patientName}`);
    } catch (error) {
      console.error(`Error uploading dispense for ${dispense.patientName}:`, error);
    }
  }
}

uploadPrescriptions().then(() => console.log('Upload complete'));
