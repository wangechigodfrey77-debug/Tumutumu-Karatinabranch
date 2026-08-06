const fs = require('fs');

// We will parse the OCR text of July 2026 lab results
const ocrText = fs.existsSync('july_lab_ocr.txt') ? fs.readFileSync('july_lab_ocr.txt', 'utf8') : '';
console.log('OCR text length:', ocrText.length);
