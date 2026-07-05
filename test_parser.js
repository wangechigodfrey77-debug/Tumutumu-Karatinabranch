const rawText = `OP002774/26        Alpha Wanjohi Kirethi     1330842   Cephalexin (Leocef) Syp      jimmwangi            2.00                110.00     220.00
100ml 1
OP002774/26        Alpha Wanjohi Kirethi     1330842   Paracetamol Syrup 100mls     jimmwangi            1.00                 60.00      60.00
(Curamol -`;

const opRegex = /^(OP\d+\/\d+|OP\d+|WK\d+)\s+([A-Za-z\s,.\'-]+?)\s+(\d+)\s+(.+?)\s+([a-zA-Z._-]+)\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)/;
const lines = rawText.split('\n');
let prescriptions = [];
let currentPrescription = null;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(opRegex);
    if (match) {
        if (currentPrescription) prescriptions.push(currentPrescription);
        currentPrescription = {
            patientId: match[1].trim(),
            patientName: match[2].trim(),
            medicationName: match[4].trim(),
            dispensedBy: match[5].trim(),
            quantity: parseFloat(match[6]),
            pricePerUnit: parseFloat(match[7].replace(/,/g, '')),
            totalCost: parseFloat(match[8].replace(/,/g, ''))
        };
    } else if (currentPrescription && !line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total|)/)) {
        if (!line.match(/^[a-zA-Z._-]+$/)) {
            currentPrescription.medicationName += ' ' + line;
        }
    }
}
if (currentPrescription) prescriptions.push(currentPrescription);
console.log(prescriptions);
