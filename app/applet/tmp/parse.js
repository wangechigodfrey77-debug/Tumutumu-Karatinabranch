import fs from 'fs';

function parseCSVLine(text) {
  let fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

let input = '';
process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  const lines = input.split('\n');
  const records = [];
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 9) continue;

    const patientId = fields[0].replace(/"/g, '') || '';
    const patientName = fields[1].replace(/"/g, '') || '';
    const prescriptionNo = fields[2].replace(/"/g, '') || '';
    const datePrescribed = fields[3].replace(/"/g, '') || '';
    const medicationName = fields[4].replace(/"/g, '') || '';
    const quantity = parseFloat(fields[5]) || 0;
    const doctor = fields[6].replace(/"/g, '') || '';
    const price = parseFloat(fields[7]) || 0;
    const totalCost = parseFloat(fields[8]) || (quantity * price);

    const record = {
      id: `DISP-AUG-${idCounter++}-${patientId.replace(/[^a-zA-Z0-9]/g, '-') || 'WALKIN'}`,
      patientId,
      patientName,
      medicationName,
      dispensedBy: doctor,
      quantity,
      pricePerUnit: price,
      totalCost,
      dispenseDate: datePrescribed
    };
    records.push(record);
  }

  const output = `import { MedicationDispense } from './types';

export const rawAugustDispenses: MedicationDispense[] = ${JSON.stringify(records, null, 2)};
`;

  fs.writeFileSync('./src/extractedAugustDispensesData.ts', output);
  console.log(`Successfully parsed and wrote ${records.length} August dispense records.`);
});
