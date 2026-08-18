import fs from 'fs';
import path from 'path';
import { renderContractPdfBuffer } from '../src/lib/contracts/renderContract';

function getFormattedTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function generate() {
  const args = process.argv.slice(2);
  const clientName = args[0] || 'Ron Boucher';
  const price = args[1] || '$1,699';
  const planName = args[2] || 'Essential Reach Publishing Plan';
  const date = args[3] || 'August 5th, 2026';

  const timestamp = getFormattedTimestamp();
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `document_${safeName}_${timestamp}.pdf`;

  console.log(`Generating unique contract PDF: ${fileName}...`);
  let scopeOfServices = [];
  if (planName.toLowerCase().includes('global')) {
    scopeOfServices = [
      'Professional Editing',
      'Professional Formatting according to International Publishing Standards',
      'Typesetting: e-book, Paperback and Hardcover',
      'Professional Proofreading & Final Revision',
      'Authors Central Page: Author Intro on the Platform for Branding',
      'Book Profile & Summary Discussion',
      'Print-on-demand services - No limit of purchase',
      'Book Categorization & Optimization',
      'Keyword Enhancement, Integration, and Optimization',
      'Publishing on 10 Platforms (Barnes & Noble, Amazon, IngramSpark, Google Books, Apple Books, Books Express, KOBO, Draft2Digital, Chapters Indigo, Walmart)',
      'Customized Cover Design (front, spine and back)',
      'Multiple Book Formats: eBook, Paperback & Hardcover',
      'Unlimited Revisions',
      'ISBN and Barcode Assignment',
      'Dedicated Project Manager Support',
      'Copyright Registration'
    ];
  } else if (planName.toLowerCase().includes('nationwide')) {
    scopeOfServices = [
      'Professional Editing',
      'Professional Formatting according to International Publishing Standards',
      'Typesetting: e-book, Paperback & Hardcover',
      'Proofreading & Final Revision',
      "Experts' Feedback on the Manuscript",
      'Print-on-demand services - No limit on purchases',
      'Unlimited Revisions - Making endless changes',
      'Publication on 5 platforms (Amazon Kindle, IngramSpark, Barnes & Noble, Kobo, and Walmart)',
      'Customized Cover Design (front, spine and back)',
      "Author's Profile Creation and Book Profile",
      'Multiple Book Formats - e-book, Paperback & Hardcover',
      'Premium ISBN and Barcode',
      'Dedicated Project Manager'
    ];
  } else {
    // Default / Kickstarter
    scopeOfServices = [
      'Professional Editing',
      'Professional Formatting according to International Publishing Standards',
      'Typesetting: e-book, Paperback & Hardcover',
      'Proofreading & Final Revision',
      "Experts' Feedback on the Manuscript",
      'Print-on-demand services - No limit on purchases',
      'Unlimited Revisions - Making endless changes',
      'Publication on 5 platforms (Amazon Kindle, IngramSpark, Barnes & Noble, Kobo, and Walmart)',
      'Customized Cover Design (front, spine and back)',
      "Author's Profile Creation and Book Profile",
      'Multiple Book Formats - e-book, Paperback & Hardcover',
      'ISBN and Barcode',
      'Dedicated Project Manager'
    ];
  }

  const buffer = await renderContractPdfBuffer({
    clientName,
    date,
    planName,
    price,
    representativeName: 'Emma',
    scopeOfServices
  });

  // Ensure output directories exist
  const outputDir = path.join(__dirname, '..', 'generated_contracts');
  const publicDir = path.join(__dirname, '..', 'public', 'contracts');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const uniqueFilePath = path.join(outputDir, fileName);
  const uniquePublicPath = path.join(publicDir, fileName);

  // Write unique timestamped files
  fs.writeFileSync(uniqueFilePath, buffer);
  fs.writeFileSync(uniquePublicPath, buffer);

  // Also update standard document.pdf pointer for quick access
  const rootLatestPath = path.join(__dirname, '..', 'document.pdf');
  const publicLatestPath = path.join(__dirname, '..', 'public', 'document.pdf');
  fs.writeFileSync(rootLatestPath, buffer);
  fs.writeFileSync(publicLatestPath, buffer);

  console.log(`✅ Success! New contract saved:`);
  console.log(`   - Unique File:   ${uniqueFilePath}`);
  console.log(`   - Public Web:    /contracts/${fileName}`);
  console.log(`   - Latest Pointer: ${rootLatestPath}`);
}

generate().catch(console.error);
