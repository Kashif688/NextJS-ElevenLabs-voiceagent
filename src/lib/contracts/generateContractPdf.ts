import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

export interface ContractData {
  clientName: string;
  date?: string;
  planName?: string;
  price?: string;
  representativeName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

// Exact Brand Colors from Original PDF
const BRAND_ORANGE = rgb(0.92, 0.49, 0.12); // #eb7d1f
const BANNER_ORANGE = rgb(0.92, 0.49, 0.12);
const LIGHT_BG = rgb(0.92, 0.92, 0.94); // #ebedf0 soft gray page backdrop
const CARD_WHITE = rgb(1, 1, 1);
const TEXT_BLACK = rgb(0.1, 0.1, 0.1);
const TEXT_DARK = rgb(0.2, 0.2, 0.2);
const TEXT_MUTED = rgb(0.4, 0.4, 0.4);
const BORDER_GRAY = rgb(0.65, 0.65, 0.65);
const YELLOW_HIGHLIGHT = rgb(1, 0.96, 0.2); // #fef533

// SVG Path for rounded rectangle
function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x + r} ${y} ` +
         `L ${x + w - r} ${y} ` +
         `A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
         `L ${x + w} ${y + h - r} ` +
         `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
         `L ${x + r} ${y + h} ` +
         `A ${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
         `L ${x} ${y + r} ` +
         `A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

// Left rounded pill (rounded on right side)
function leftCapsulePath(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x} ${y} ` +
         `L ${x + w - r} ${y} ` +
         `A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
         `L ${x + w} ${y + h - r} ` +
         `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
         `L ${x} ${y + h} Z`;
}

// Right rounded pill (rounded on left side)
function rightCapsulePath(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x + r} ${y} ` +
         `L ${x + w} ${y} ` +
         `L ${x + w} ${y + h} ` +
         `L ${x + r} ${y + h} ` +
         `A ${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
         `L ${x} ${y + r} ` +
         `A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/**
 * Draws the high-fidelity branded header matching the original design
 */
function drawHeader(page: PDFPage, fontSansBold: PDFFont, fontSansRegular: PDFFont) {
  const { width, height } = page.getSize();
  const topY = height - 15;
  const headerHeight = 70;

  // Soft shadow bar beneath header
  page.drawRectangle({
    x: 35,
    y: topY - headerHeight - 3,
    width: width - 70,
    height: 4,
    color: rgb(0.82, 0.82, 0.84),
  });

  // Left Capsule (White with curved right side)
  const leftW = 190;
  const leftH = 65;
  page.drawSvgPath(leftCapsulePath(35, topY - leftH, leftW, leftH, 32), {
    color: CARD_WHITE,
  });

  // Logo: "MPH"
  page.drawText('MPH', {
    x: 48,
    y: topY - 38,
    size: 32,
    font: fontSansBold,
    color: BRAND_ORANGE,
  });

  // Pen nib design accent beside M
  page.drawRectangle({
    x: 44,
    y: topY - 32,
    width: 3.5,
    height: 14,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Logo subtitle: "MARKETING AND PUBLISHING HOUSE LLC"
  page.drawText('MARKETING AND', {
    x: 48,
    y: topY - 48,
    size: 7,
    font: fontSansBold,
    color: rgb(0.25, 0.25, 0.25),
  });
  page.drawText('PUBLISHING HOUSE LLC', {
    x: 48,
    y: topY - 57,
    size: 5.8,
    font: fontSansBold,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Right Capsule (Orange with stadium curved left side)
  const rightW = 340;
  const rightH = 65;
  const rightX = width - 35 - rightW;
  page.drawSvgPath(rightCapsulePath(rightX, topY - rightH, rightW, rightH, 32), {
    color: BRAND_ORANGE,
  });

  // Contact items inside orange banner (2 columns, 2 rows)
  const col1X = rightX + 28;
  const col2X = rightX + 170;
  const row1Y = topY - 26;
  const row2Y = topY - 48;

  // Icons and text
  // 1. Phone
  page.drawCircle({ x: col1X + 8, y: row1Y + 3, size: 7.5, color: CARD_WHITE });
  page.drawCircle({ x: col1X + 8, y: row1Y + 3, size: 6.2, color: BRAND_ORANGE });
  page.drawText('C', { x: col1X + 5.5, y: row1Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });
  page.drawText('(229) 355-4499', { x: col1X + 20, y: row1Y, size: 7, font: fontSansBold, color: CARD_WHITE });

  // 2. Website
  page.drawCircle({ x: col1X + 8, y: row2Y + 3, size: 7.5, color: CARD_WHITE });
  page.drawCircle({ x: col1X + 8, y: row2Y + 3, size: 6.2, color: BRAND_ORANGE });
  page.drawText('W', { x: col1X + 5.2, y: row2Y, size: 6.2, font: fontSansBold, color: CARD_WHITE });
  page.drawText('Marketingandpublishinghousellc.com', { x: col1X + 20, y: row2Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });

  // 3. Email
  page.drawCircle({ x: col2X + 8, y: row1Y + 3, size: 7.5, color: CARD_WHITE });
  page.drawCircle({ x: col2X + 8, y: row1Y + 3, size: 6.2, color: BRAND_ORANGE });
  page.drawText('@', { x: col2X + 5.2, y: row1Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });
  page.drawText('connect@marketingandpublishinghousellc.com', { x: col2X + 20, y: row1Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });

  // 4. Address
  page.drawCircle({ x: col2X + 8, y: row2Y + 3, size: 7.5, color: CARD_WHITE });
  page.drawCircle({ x: col2X + 8, y: row2Y + 3, size: 6.2, color: BRAND_ORANGE });
  page.drawText('A', { x: col2X + 5.8, y: row2Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });
  page.drawText('3343 Peachtree Rd Atlanta, GA 30326', { x: col2X + 20, y: row2Y, size: 6.5, font: fontSansBold, color: CARD_WHITE });
}

/**
 * Generates the Contract PDF matching the exact visual layout from the screenshots
 */
export async function generateContractPdf(data: ContractData = {}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Serif fonts for the formal legal text (exactly as shown in original PDF)
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSerifBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  // Sans fonts for banners and headers
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const clientName = data.clientName?.trim() || 'Ron Boucher';
  const contractDate = data.date || 'August 5th, 2026';
  const planName = data.planName || 'Essential Reach Publishing Plan';
  const price = data.price || '$1,699';
  const repName = data.representativeName || 'Isabelle Harper';

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;

  // ==========================================
  // PAGE 1
  // ==========================================
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  page1.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: LIGHT_BG });
  drawHeader(page1, fontSansBold, fontSans);

  // Orange Title Banner
  const bannerY = pageHeight - 165;
  const bannerW = pageWidth - 70;
  page1.drawSvgPath(roundedRectPath(35, bannerY, bannerW, 56, 8), {
    color: BANNER_ORANGE,
  });

  const bannerText = 'NON-DISCLOSURE AGREEMENT AND BOOK PUBLISHING CONTRACT';
  const bannerTextW = fontSansBold.widthOfTextAtSize(bannerText, 12.5);
  page1.drawText(bannerText, {
    x: (pageWidth - bannerTextW) / 2,
    y: bannerY + 22,
    size: 12.5,
    font: fontSansBold,
    color: CARD_WHITE,
  });

  // White Card Container
  const cardX = 35;
  const cardY = 35;
  const cardW = pageWidth - 70;
  const cardH = pageHeight - 215;

  page1.drawSvgPath(roundedRectPath(cardX, cardY, cardW, cardH, 14), {
    color: CARD_WHITE,
  });

  let curY = pageHeight - 245;

  // Title: "SERVICE CONTRACT" (Serif, Underlined, Centered)
  const titleText = 'SERVICE CONTRACT';
  const titleW = fontSerifBold.widthOfTextAtSize(titleText, 16);
  const titleX = (pageWidth - titleW) / 2;
  page1.drawText(titleText, {
    x: titleX,
    y: curY,
    size: 16,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });
  page1.drawLine({
    start: { x: titleX, y: curY - 2.5 },
    end: { x: titleX + titleW, y: curY - 2.5 },
    thickness: 1.5,
    color: TEXT_BLACK,
  });

  curY -= 36;

  // For: Ron Boucher
  page1.drawText('For:  ', { x: cardX + 35, y: curY, size: 11, font: fontSerif, color: TEXT_BLACK });
  page1.drawText(clientName, { x: cardX + 60, y: curY, size: 11, font: fontSerifBold, color: TEXT_BLACK });

  curY -= 16;
  page1.drawText('Dated: ', { x: cardX + 35, y: curY, size: 10.5, font: fontSerif, color: TEXT_BLACK });
  page1.drawText(contractDate, { x: cardX + 70, y: curY, size: 10.5, font: fontSerif, color: TEXT_BLACK });

  curY -= 25;

  // Agreement Box
  const boxW = cardW - 70;
  const boxX = cardX + 35;
  const boxH = 58;
  page1.drawRectangle({
    x: boxX,
    y: curY - boxH,
    width: boxW,
    height: boxH,
    color: CARD_WHITE,
    borderColor: BORDER_GRAY,
    borderWidth: 0.8,
  });

  const agLine1 = 'This Agreement (“Agreement”) is made between:';
  const agLine1W = fontSerif.widthOfTextAtSize(agLine1, 10);
  page1.drawText(agLine1, {
    x: (pageWidth - agLine1W) / 2,
    y: curY - 20,
    size: 10,
    font: fontSerif,
    color: TEXT_BLACK,
  });

  const agLine2 = `Publisher: Marketing & Publishing House LLC represented by ${repName}`;
  const agLine2W = fontSerif.widthOfTextAtSize(agLine2, 9.5);
  page1.drawText(`Publisher: `, { x: boxX + 25, y: curY - 36, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  page1.drawText(`Marketing & Publishing House LLC `, { x: boxX + 72, y: curY - 36, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });
  page1.drawText(`represented by `, { x: boxX + 242, y: curY - 36, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  page1.drawText(repName, { x: boxX + 312, y: curY - 36, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });

  const agLine3 = `and Author: ${clientName}`;
  const agLine3W = fontSerif.widthOfTextAtSize(agLine3, 9.5);
  page1.drawText(`and Author: `, { x: (pageWidth - agLine3W) / 2 - 25, y: curY - 48, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  page1.drawText(clientName, { x: (pageWidth - agLine3W) / 2 + 28, y: curY - 48, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });

  curY -= (boxH + 25);

  // 1. PURPOSE OF AGREEMENT
  page1.drawText('1. PURPOSE OF AGREEMENT', {
    x: cardX + 35,
    y: curY,
    size: 11.5,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  curY -= 17;
  page1.drawText('This Agreement outlines the professional relationship between the Publisher and the Author', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  curY -= 13;
  page1.drawText('for the proofreading, formatting, adjusting, designing & publishing of the Author’s drafted book.', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });

  curY -= 20;
  page1.drawText('This contract also includes a binding Non-Disclosure Agreement (', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  page1.drawText('NDA', { x: cardX + 295, y: curY, size: 9.5, font: fontSerifItalic, color: TEXT_BLACK });
  page1.drawText(') protecting all', { x: cardX + 318, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  curY -= 13;
  page1.drawText('content, materials, and communication shared between the parties.', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });

  curY -= 25;

  // 2. AUTHOR RESPONSIBILITIES
  page1.drawText('2. AUTHOR RESPONSIBILITIES', {
    x: cardX + 35,
    y: curY,
    size: 11.5,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  curY -= 17;
  page1.drawText('The Author agrees to:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });

  const authorBullets = [
    'Provide the full manuscript and all required materials before project initiation.',
    'Respond to revisions within 3–5 business days and approves deliverables in a timely manner.',
    'Provide accurate details for book setup, metadata, and author information.',
    'Maintain clear and respectful communication throughout the project.',
    'The Author agrees to provide necessary access, credentials, or OTP related to account set up for publishing purposes.'
  ];

  curY -= 16;
  for (const b of authorBullets) {
    page1.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    if (b.length > 76) {
      const splitIdx = b.lastIndexOf(' ', 72);
      const l1 = b.substring(0, splitIdx);
      const l2 = b.substring(splitIdx + 1);
      page1.drawText(l1, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
      curY -= 12;
      page1.drawText(l2, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    } else {
      page1.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    }
    curY -= 14;
  }

  // ==========================================
  // PAGE 2
  // ==========================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  page2.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: LIGHT_BG });
  drawHeader(page2, fontSansBold, fontSans);

  page2.drawSvgPath(roundedRectPath(cardX, cardY, cardW, pageHeight - 125, 14), {
    color: CARD_WHITE,
  });

  curY = pageHeight - 145;

  // 3. SCOPE OF SERVICES [Plan Name]
  page2.drawText(`3. SCOPE OF SERVICES [${planName}]`, {
    x: cardX + 35,
    y: curY,
    size: 11.5,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  curY -= 18;
  page2.drawText('Publisher/Marketing Company agrees to perform the following services professionally and', {
    x: cardX + 35,
    y: curY,
    size: 9.5,
    font: fontSerif,
    color: TEXT_BLACK,
  });
  curY -= 13;
  page2.drawText('in a timely manner:', {
    x: cardX + 35,
    y: curY,
    size: 9.5,
    font: fontSerif,
    color: TEXT_BLACK,
  });

  curY -= 20;
  page2.drawText('Publishing Support:', {
    x: cardX + 35,
    y: curY,
    size: 10,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  const scopeBullets = [
    'Professional Editing & Advanced Formatting according to the International Publishing Standards.',
    'Professional Typesetting & Proofreading.',
    'Amazon Author Central Page Setup.',
    'Book Profile & Summary Development.',
    'Print-on-Demand Setup.',
    '12 Custom Made Graphics/Illustrations.',
    'Category Selection & Optimization.',
    'Keyword Research & Optimization.',
    'Publishing on Amazon, Barnes & Nobles, LULU, Google Books & Apple Books.',
    'Book Cover Design (front, spine and back).',
    'ISBN & Barcode Assignment.',
    'Copyrights Registration and Library of Congress Control Number (LCCN)',
    'Multiple Book Formats (eBook, Paperback and Hardcover).',
    'Unlimited Revisions.',
    'Competitive Book Pricing Strategy.',
    'Dedicated Project Manager.'
  ];

  curY -= 16;
  for (const item of scopeBullets) {
    page2.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    const isSpecial = item.startsWith('Publishing on Amazon');
    const f = isSpecial ? fontSerifBold : fontSerif;
    
    if (item.length > 72) {
      const splitIdx = item.lastIndexOf(' ', 68);
      const l1 = item.substring(0, splitIdx);
      const l2 = item.substring(splitIdx + 1);
      page2.drawText(l1, { x: cardX + 56, y: curY, size: 9, font: f, color: TEXT_BLACK });
      curY -= 12;
      page2.drawText(l2, { x: cardX + 56, y: curY, size: 9, font: f, color: TEXT_BLACK });
    } else {
      page2.drawText(item, { x: cardX + 56, y: curY, size: 9, font: f, color: TEXT_BLACK });
    }
    curY -= 15;
  }

  // ==========================================
  // PAGE 3
  // ==========================================
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  page3.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: LIGHT_BG });
  drawHeader(page3, fontSansBold, fontSans);

  page3.drawSvgPath(roundedRectPath(cardX, cardY, cardW, pageHeight - 125, 14), {
    color: CARD_WHITE,
  });

  curY = pageHeight - 145;

  // 4. PAYMENT TERMS
  page3.drawText('4. PAYMENT TERMS', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 18;
  page3.drawText('The payment terms decided are as follows:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });

  curY -= 22;
  // Total Investment Highlighted Box
  const invText = `Total Investment: ${price}`;
  const invWidth = fontSerifBold.widthOfTextAtSize(invText, 11) + 20;
  page3.drawRectangle({
    x: cardX + 48,
    y: curY - 4,
    width: invWidth,
    height: 18,
    color: YELLOW_HIGHLIGHT,
  });
  page3.drawCircle({ x: cardX + 42, y: curY + 5, size: 2, color: TEXT_BLACK });
  page3.drawText(invText, { x: cardX + 58, y: curY, size: 11, font: fontSerifBold, color: TEXT_BLACK });

  curY -= 25;
  page3.drawText('The payment is to be paid up front unless otherwise decided by both parties.', {
    x: cardX + 35,
    y: curY,
    size: 9.5,
    font: fontSerif,
    color: TEXT_BLACK,
  });

  curY -= 20;
  page3.drawText('Refund Policy', { x: cardX + 35, y: curY, size: 10, font: fontSerifBold, color: TEXT_BLACK });

  const refundBullets = [
    'Refund applies only if the Company fails to deliver agreed services within the defined timeline due to internal fault.',
    'No refund applies if delays are caused by the Author (e.g., late feedback, incomplete materials).',
    'Work begins only after upfront payment is received if otherwise decided.',
    'The Author shall be entitled to request a refund if the Company materially fails to provide the services outlined in this Agreement in accordance with the agreed scope of work and professional standards.'
  ];

  curY -= 15;
  for (const b of refundBullets) {
    page3.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    if (b.length > 72) {
      const splitIdx = b.lastIndexOf(' ', 68);
      const l1 = b.substring(0, splitIdx);
      const l2 = b.substring(splitIdx + 1);
      page3.drawText(l1, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
      curY -= 12;
      page3.drawText(l2, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    } else {
      page3.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    }
    curY -= 14;
  }

  curY -= 10;

  // 5. TIMELINE & PROCESS
  page3.drawText('5. TIMELINE & PROCESS', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 16;
  page3.drawText('A full timeline will be provided after reviewing the project however:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  curY -= 14;
  page3.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page3.drawText('The ideal timeline is 5-7 weeks or otherwise decided by both parties.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });

  curY -= 22;

  // 6. INTELLECTUAL PROPERTY RIGHTS
  page3.drawText('6. INTELLECTUAL PROPERTY RIGHTS', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  const ipBullets = [
    'Author retains 100% ownership of the manuscript.',
    'Author retains 100% ownership of the final edited manuscript.',
    'Author retains 100% ownership of all cover designs after full payment is completed.',
    'Publisher does not claim any rights, royalties, or creative control.',
    'All royalties earned belong solely to the Author.',
    'Publisher does not participate in royalty revenue.'
  ];
  curY -= 15;
  for (const b of ipBullets) {
    page3.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    page3.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    curY -= 13;
  }

  curY -= 10;

  // 7. NDA - CONFIDENTIALITY & NON-DISCLOSURE
  page3.drawText('7. NDA - CONFIDENTIALITY & NON-DISCLOSURE', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 16;
  page3.drawText('Both parties agree that:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 14;
  page3.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page3.drawText('All materials shared by the Author (manuscript, notes, images, drafts) will remain', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
  curY -= 12;
  page3.drawText('confidential.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
  curY -= 13;
  page3.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page3.drawText('All discussions, strategies, and communication will remain between the publisher and', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
  curY -= 12;
  page3.drawText('Author.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });

  // ==========================================
  // PAGE 4
  // ==========================================
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  page4.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: LIGHT_BG });
  drawHeader(page4, fontSansBold, fontSans);

  page4.drawSvgPath(roundedRectPath(cardX, cardY, cardW, pageHeight - 125, 14), {
    color: CARD_WHITE,
  });

  curY = pageHeight - 145;

  const ndaContBullets = [
    'All files, documents, and intellectual property shall remain strictly confidential.',
    'The Author shall retain 100% ownership and all intellectual property rights to the Book at all times, notwithstanding the Publisher\'s involvement in managing, coordinating, or executing any aspect of the publishing process.'
  ];

  for (const b of ndaContBullets) {
    page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    if (b.length > 72) {
      const splitIdx = b.lastIndexOf(' ', 68);
      const l1 = b.substring(0, splitIdx);
      const l2 = b.substring(splitIdx + 1);
      page4.drawText(l1, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
      curY -= 12;
      page4.drawText(l2, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    } else {
      page4.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    }
    curY -= 15;
  }

  curY -= 8;
  page4.drawText('The Publisher/Marketing Company shall not:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });
  const pubNot = [
    'Disclose manuscript content.',
    'Share drafts or files with third parties.',
    'Release any project details publicly without permission.'
  ];
  curY -= 14;
  for (const b of pubNot) {
    page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    page4.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    curY -= 13;
  }

  curY -= 8;
  page4.drawText('The Author shall not:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 14;
  page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page4.drawText('Disclose proprietary workflow, pricing structure, internal communication, or business', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
  curY -= 12;
  page4.drawText('processes of the Publisher.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });

  curY -= 16;
  page4.drawText('This NDA remains active even after the project ends.', { x: cardX + 35, y: curY, size: 9, font: fontSerifItalic, color: TEXT_BLACK });

  curY -= 25;

  // 8. TERMINATION POLICY
  page4.drawText('8. TERMINATION POLICY', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 16;
  page4.drawText('Publisher/Marketing Support may terminate the Agreement if:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  const termBullets = [
    'Author becomes unresponsive for 14+ days unless there is a genuine reason behind it.',
    'Author engages in abusive conduct.',
    'Author files a false dispute or chargeback.'
  ];
  curY -= 14;
  for (const b of termBullets) {
    page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    page4.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    curY -= 13;
  }

  curY -= 8;
  page4.drawText('In all termination cases:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 14;
  page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page4.drawText('No refunds.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
  curY -= 13;
  page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
  page4.drawText('Publisher/Marketing Company is not obligated to deliver remaining work.', { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });

  curY -= 25;

  // 9. LIMITATION OF LIABILITY
  page4.drawText('9. LIMITATION OF LIABILITY', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 16;
  page4.drawText('Publisher/Marketing Support is not responsible for:', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  const liabBullets = [
    'Amazon printing delays.',
    'The Company shall not be liable for indirect, incidental, or consequential damages.',
    'Changes in Publishing Platforms Publishing Rules.',
    'Maximum liability shall not exceed the total amount paid under this agreement.'
  ];
  curY -= 14;
  for (const b of liabBullets) {
    page4.drawCircle({ x: cardX + 46, y: curY + 3, size: 1.8, color: TEXT_BLACK });
    page4.drawText(b, { x: cardX + 56, y: curY, size: 9, font: fontSerif, color: TEXT_BLACK });
    curY -= 13;
  }

  // ==========================================
  // PAGE 5
  // ==========================================
  const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
  page5.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: LIGHT_BG });
  drawHeader(page5, fontSansBold, fontSans);

  page5.drawSvgPath(roundedRectPath(cardX, cardY, cardW, pageHeight - 125, 14), {
    color: CARD_WHITE,
  });

  curY = pageHeight - 145;

  // 10. GOVERNING LAW
  page5.drawText('10. GOVERNING LAW', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });
  curY -= 16;
  page5.drawText('This Agreement shall be governed by and interpreted according to the laws of the State of', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });
  curY -= 13;
  page5.drawText('Georgia, USA.', { x: cardX + 35, y: curY, size: 9.5, font: fontSerif, color: TEXT_BLACK });

  curY -= 35;

  // 11. ACCEPTANCE & SIGNATURES
  page5.drawText('11. ACCEPTANCE & SIGNATURES', { x: cardX + 35, y: curY, size: 11.5, font: fontSerifBold, color: TEXT_BLACK });

  curY -= 25;

  // Signatures Table / Card (Matching exact styling)
  const sigTableWidth = cardW - 70;
  const sigTableX = cardX + 35;
  const sigTableHeight = 120;
  const sigTableY = curY - sigTableHeight;

  // Container with rounded corners
  page5.drawSvgPath(roundedRectPath(sigTableX, sigTableY, sigTableWidth, sigTableHeight, 14), {
    color: rgb(0.95, 0.95, 0.96),
  });

  // Top Orange Header Bar of the Signature Box (with rounded top corners)
  page5.drawSvgPath(
    `M ${sigTableX + 14} ${sigTableY + sigTableHeight} ` +
    `L ${sigTableX + sigTableWidth - 14} ${sigTableY + sigTableHeight} ` +
    `A 14 14 0 0 1 ${sigTableX + sigTableWidth} ${sigTableY + sigTableHeight - 14} ` +
    `L ${sigTableX + sigTableWidth} ${sigTableY + sigTableHeight - 34} ` +
    `L ${sigTableX} ${sigTableY + sigTableHeight - 34} ` +
    `L ${sigTableX} ${sigTableY + sigTableHeight - 14} ` +
    `A 14 14 0 0 1 ${sigTableX + 14} ${sigTableY + sigTableHeight} Z`,
    { color: BRAND_ORANGE }
  );

  // Middle vertical divider line
  page5.drawLine({
    start: { x: sigTableX + sigTableWidth / 2, y: sigTableY },
    end: { x: sigTableX + sigTableWidth / 2, y: sigTableY + sigTableHeight - 34 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Author column
  const authorColCenter = sigTableX + (sigTableWidth / 4);
  const authorTextW = fontSansBold.widthOfTextAtSize('Author:', 9.5);
  const authorNameW = fontSansBold.widthOfTextAtSize(clientName, 9);
  page5.drawText('Author:', {
    x: authorColCenter - (authorTextW / 2),
    y: sigTableY + sigTableHeight - 14,
    size: 9.5,
    font: fontSansBold,
    color: CARD_WHITE,
  });
  page5.drawText(clientName, {
    x: authorColCenter - (authorNameW / 2),
    y: sigTableY + sigTableHeight - 26,
    size: 9,
    font: fontSansBold,
    color: CARD_WHITE,
  });

  // Publisher column
  const pubColCenter = sigTableX + (sigTableWidth * 0.75);
  const pubTextW = fontSansBold.widthOfTextAtSize('Marketing & Publishing House LLC', 9);
  const repNameW = fontSansBold.widthOfTextAtSize(repName, 9);
  page5.drawText('Marketing & Publishing House LLC', {
    x: pubColCenter - (pubTextW / 2),
    y: sigTableY + sigTableHeight - 14,
    size: 9,
    font: fontSansBold,
    color: CARD_WHITE,
  });
  page5.drawText(repName, {
    x: pubColCenter - (repNameW / 2),
    y: sigTableY + sigTableHeight - 26,
    size: 9,
    font: fontSansBold,
    color: CARD_WHITE,
  });

  // Author Signature Line
  page5.drawText('Signature: ', {
    x: sigTableX + 18,
    y: sigTableY + 48,
    size: 9,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });
  page5.drawLine({
    start: { x: sigTableX + 70, y: sigTableY + 48 },
    end: { x: sigTableX + (sigTableWidth / 2) - 15, y: sigTableY + 48 },
    thickness: 1,
    color: TEXT_BLACK,
  });

  page5.drawText(`Dated: ${contractDate}`, {
    x: authorColCenter - (fontSerifBold.widthOfTextAtSize(`Dated: ${contractDate}`, 8.5) / 2),
    y: sigTableY + 18,
    size: 8.5,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  // Publisher Signature Line & Cursive Script
  page5.drawText('Signature: ', {
    x: sigTableX + (sigTableWidth / 2) + 15,
    y: sigTableY + 48,
    size: 9,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  // Isabelle Harper cursive signature
  page5.drawText(repName, {
    x: sigTableX + (sigTableWidth / 2) + 70,
    y: sigTableY + 50,
    size: 18,
    font: fontSerifItalic,
    color: TEXT_BLACK,
  });

  page5.drawLine({
    start: { x: sigTableX + (sigTableWidth / 2) + 65, y: sigTableY + 48 },
    end: { x: sigTableX + sigTableWidth - 15, y: sigTableY + 48 },
    thickness: 1,
    color: TEXT_BLACK,
  });

  page5.drawText(`Dated: ${contractDate}`, {
    x: pubColCenter - (fontSerifBold.widthOfTextAtSize(`Dated: ${contractDate}`, 8.5) / 2),
    y: sigTableY + 18,
    size: 8.5,
    font: fontSerifBold,
    color: TEXT_BLACK,
  });

  return await pdfDoc.save();
}
