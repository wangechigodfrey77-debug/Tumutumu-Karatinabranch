const fs = require('fs');
const data = fs.readFileSync('all_ocr.txt', 'utf-8');
const lines = data.split('\n');

const opRegex = /^(OP[0-9/]+|WK\d+|OP\d+|- -|- -[A-Za-z\s]+|-|WK\d+\s+[-A-Za-z\s]+)\s+([A-Za-z\s,.\'-]+?)\s+(\d+)\s+(.+?)\s+([a-zA-Z._-]+)\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)/;

let total = 0;
let matchCount = 0;
let unmatchCount = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim().replace(/^"|"$/g, '').trim();
    if (!line) continue;
    if (line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total||Printed|==)/)) continue;

    // A simpler regex to just catch the amount at the end
    // Format: PatientNo  Name  PrNo Description  Doc  Qty UnitPrice Amount
    // The problem might be doc names with spaces or missing PrNo?
    // Let's try matching from the back: Qty UnitPrice Amount
    const endMatch = line.match(/\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)$/);
    if (endMatch) {
        total += parseFloat(endMatch[3].replace(/,/g, ''));
        matchCount++;
    } else {
        if (line.match(/\d+\.\d+$/)) {
            console.log("Missed potential line:", line);
        }
        unmatchCount++;
    }
}
console.log("Total from endMatch:", total.toFixed(2), "Matched lines:", matchCount);
