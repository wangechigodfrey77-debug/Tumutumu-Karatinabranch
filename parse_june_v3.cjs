const fs = require('fs');
const data = fs.readFileSync('all_ocr.txt', 'utf-8');

const matches = [];
const lines = data.split('\n');

// The format usually goes like:
// OP002774/26        Alpha Wanjohi Kirethi     1330842   Cephalexin (Leocef) Syp      jimmwangi            2.00                110.00     220.00
// 100ml 1
// It can also be spread over multiple lines:
// OP002774/26        Alpha Wanjohi Kirethi     1330842   Paracetamol Syrup 100mls     jimmwangi            1.00                 60.00      60.00
// (Curamol -

// Look for lines that end with QTY UNIT_PRICE AMOUNT
const endPattern = /\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)$/;

let pendingText = "";
let total = 0;

for(let i=0; i<lines.length; i++) {
    let line = lines[i].replace(/^"|"$/g, '').trim();
    if (!line) continue;
    if (line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total||Printed|==)/)) continue;

    pendingText += (pendingText ? " " : "") + line;
    
    let endMatch = pendingText.match(endPattern);
    if (endMatch) {
        let frontPart = pendingText.replace(endPattern, '');
        let qty = endMatch[1];
        let price = endMatch[2];
        let amount = endMatch[3];
        
        let startMatch = frontPart.match(/(OP\d+\/\d+|OP\d+|WK\d+|[-]{1,2})\s+([\s\S]+?)\s+(\d+)\s+([\s\S]+)$/);
        
        let patientId = "Unknown";
        let patientName = "Unknown";
        let medicationName = "Unknown";
        
        if (startMatch) {
            patientId = startMatch[1].trim();
            patientName = startMatch[2].trim();
            medicationName = startMatch[4].trim();
        } else {
            let fallbackMatch = frontPart.match(/(OP\d+\/\d+|OP\d+|WK\d+|[-]{1,2})\s+([\s\S]+)$/);
            if (fallbackMatch) {
                patientId = fallbackMatch[1].trim();
                medicationName = fallbackMatch[2].trim();
            } else {
                medicationName = frontPart.trim();
            }
        }
        
        // Remove trailing doc name from medicationName if present
        let docMatch = medicationName.match(/([\s\S]+)\s+([a-zA-Z._-]+)$/);
        let dispensedBy = "jimmwangi"; // fallback
        if (docMatch) {
             medicationName = docMatch[1].trim();
             dispensedBy = docMatch[2].trim();
        }

        total += parseFloat(amount.replace(/,/g, ''));
        matches.push({
            patientId,
            patientName,
            medicationName,
            quantity: parseFloat(qty),
            pricePerUnit: parseFloat(price.replace(/,/g, '')),
            totalCost: parseFloat(amount.replace(/,/g, '')),
            dispensedBy
        });
        pendingText = "";
    }
}

console.log("Found matches:", matches.length);
console.log("Total Amount:", total.toFixed(2));
