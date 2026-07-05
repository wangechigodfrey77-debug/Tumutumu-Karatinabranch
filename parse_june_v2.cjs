const fs = require('fs');
const data = fs.readFileSync('all_ocr.txt', 'utf-8');

// We'll extract all items by finding the trailing numbers: QTY UNIT_PRICE AMOUNT
// We can use a regex that matches the patient ID, then captures everything up to the 3 numbers.

const matches = [];
const lines = data.split('\n');

let currentPrescription = null;

// Pattern: PatientID Name PrNo Description Doc Qty Price Amount
const startPattern = /^(OP\d+\/\d+|OP\d+|WK\d+)\s+([A-Za-z\s,.\'-]+?)\s+(\d+)\s+(.+)$/;
const endPattern = /(.*?)\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)$/;

let pendingText = "";

for(let i=0; i<lines.length; i++) {
    let line = lines[i].replace(/^"|"$/g, '').trim();
    if (!line) continue;
    if (line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total||Printed|==)/)) continue;

    pendingText += (pendingText ? " " : "") + line;
    
    let endMatch = pendingText.match(endPattern);
    if (endMatch) {
        let frontPart = endMatch[1];
        let qty = endMatch[2];
        let price = endMatch[3];
        let amount = endMatch[4];
        
        let startMatch = frontPart.match(startPattern);
        if (startMatch) {
            matches.push({
                patientId: startMatch[1].trim(),
                patientName: startMatch[2].trim(),
                prNo: startMatch[3].trim(),
                descriptionAndDoc: startMatch[4].trim(),
                quantity: parseFloat(qty),
                pricePerUnit: parseFloat(price.replace(/,/g, '')),
                totalCost: parseFloat(amount.replace(/,/g, ''))
            });
            pendingText = "";
        } else {
            // It might have matched the end, but the start pattern is broken.
            // Let's see if there's an OP pattern inside it
            let fallbackStartMatch = frontPart.match(/(OP\d+\/\d+|OP\d+|WK\d+)\s+([\s\S]+)$/);
            if (fallbackStartMatch) {
                matches.push({
                    patientId: fallbackStartMatch[1].trim(),
                    rest: fallbackStartMatch[2].trim(),
                    quantity: parseFloat(qty),
                    pricePerUnit: parseFloat(price.replace(/,/g, '')),
                    totalCost: parseFloat(amount.replace(/,/g, ''))
                });
                pendingText = "";
            }
        }
    }
}

let total = 0;
matches.forEach(m => {
    total += m.totalCost;
});

console.log("Found matches:", matches.length);
console.log("Total Amount:", total.toFixed(2));
