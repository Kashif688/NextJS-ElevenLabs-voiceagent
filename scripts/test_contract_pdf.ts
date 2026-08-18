import fs from 'fs';
import path from 'path';
import { renderContractPdfBuffer } from '../src/lib/contracts/renderContract';

async function test() {
  console.log('Rendering Contract PDF via @react-pdf/renderer (React TSX)...');
  const buffer = await renderContractPdfBuffer({
    clientName: 'Ron Boucher',
    date: 'August 5th, 2026',
    planName: 'Essential Reach Publishing Plan',
    price: '$1,699',
    representativeName: 'Emma',
  });

  const outputPath = path.join(__dirname, 'test_contract_output.pdf');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Contract PDF successfully generated with React TSX at: ${outputPath} (${buffer.length} bytes)`);
}

test().catch(console.error);
