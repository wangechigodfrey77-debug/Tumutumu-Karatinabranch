const fs = require('fs');
const data = fs.readFileSync('all_ocr.txt', 'utf-8');
const lines = data.split('\n');

let total = 0;
let matchCount = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim().replace(/^"|"$/g, '').trim();
    if (!line) continue;
    if (line.match(/^(Prescriptions|P\.C\.E\.A|Pharmacy|Patient No|g Doc\.|Total||Printed|==)/)) continue;

    const endMatch = line.match(/\s+(-?\d+\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)\s+(-?\d{1,3}(?:,\d{3})*\.\d+)$/);
    if (endMatch) {
        total += parseFloat(endMatch[3].replace(/,/g, ''));
        matchCount++;
    } else {
        if (line.match(/\d+\.\d+$/)) {
            console.log("Missed potential line:", line);
        }
    }
}
console.log("Total from endMatch:", total.toFixed(2), "Matched lines:", matchCount);
