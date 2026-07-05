const fs = require('fs');

const data = fs.readFileSync('all_ocr.txt', 'utf-8');
const lines = data.split('\n');

let prescriptions = [];
let currentPrescription = null;

const opRegex = /^(OP\d+\/\d+|OP\d+|WK\d+)\s+([A-Za-z\s,.\'-]+?)\s+(\d+)\s+(.+?)\s+([a-zA-Z._-]+)\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)/;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    line = line.replace(/^"|"$/g, '').trim();

    const match = line.match(opRegex);
    if (match) {
        if (currentPrescription) {
            prescriptions.push(currentPrescription);
        }
        currentPrescription = {
            patientId: match[1].trim(),
            patientName: match[2].trim(),
            medicationName: match[4].trim(),
            dispensedBy: match[5].trim(),
            quantity: parseFloat(match[6]),
            pricePerUnit: parseFloat(match[7].replace(/,/g, '')),
            totalCost: parseFloat(match[8].replace(/,/g, '')),
            dispenseDate: "2026-06-04" 
        };
    } else if (currentPrescription && !line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total|)/)) {
        if (!line.match(/^[a-zA-Z._-]+$/)) {
            currentPrescription.medicationName += ' ' + line;
        }
    }
}

if (currentPrescription) {
    prescriptions.push(currentPrescription);
}

let totalAmount = 0;
prescriptions.forEach(p => {
    totalAmount += p.totalCost;
});

fs.writeFileSync('src/data/june_prescriptions.json', JSON.stringify(prescriptions, null, 2));
console.log('Total prescriptions:', prescriptions.length);
console.log('Total Amount Calculated:', totalAmount.toFixed(2));
