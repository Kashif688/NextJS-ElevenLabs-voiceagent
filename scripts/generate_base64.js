const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '..', 'public', 'contract_header.png');
const outPath = path.join(__dirname, '..', 'src', 'components', 'contracts', 'headerImageBase64.ts');

const buffer = fs.readFileSync(imagePath);
const base64 = buffer.toString('base64');

const content = `export const headerImageBase64 = "data:image/png;base64,${base64}";\n`;
fs.writeFileSync(outPath, content);
console.log('Done!');
