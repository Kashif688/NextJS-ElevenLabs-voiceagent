export interface ParsedLeadRow {
  rowIndex: number;
  rawPhone: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  bookTopic?: string;
  writingStage?: string;
  context?: string;
  isValid: boolean;
  errorReason?: string;
}

export function validateAndNormalizePhone(phoneStr: string): { normalized: string; isValid: boolean; reason?: string } {
  if (!phoneStr) return { normalized: "", isValid: false, reason: "Missing phone number" };

  let clean = String(phoneStr).trim().replace(/[\s\-\(\)\.]/g, "");
  
  // Strip non-digit characters except leading +
  const hasPlus = clean.startsWith("+");
  clean = clean.replace(/[^\d]/g, "");
  if (hasPlus) clean = "+" + clean;

  if (!clean.startsWith("+")) {
    // If standard 10-digit North American number (e.g., 7706298005) -> +17706298005
    if (clean.length === 10) {
      clean = "+1" + clean;
    } else if (clean.length === 11 && clean.startsWith("1")) {
      clean = "+" + clean;
    } else if (clean.length >= 8 && clean.length <= 15) {
      clean = "+" + clean;
    }
  }

  const phoneRegex = /^\+[1-9]\d{7,14}$/;
  if (!phoneRegex.test(clean)) {
    return {
      normalized: clean,
      isValid: false,
      reason: "Invalid phone format. Must be E.164 (e.g. +17706298005)",
    };
  }

  return { normalized: clean, isValid: true };
}

export function parseDelimitedText(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter from first non-empty line
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";
  else if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ";";
  else if (pipeCount > commaCount) delimiter = "|";

  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  return rows;
}

export function parseLeadSheetData(rows: string[][]): {
  leads: ParsedLeadRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
} {
  if (!rows || rows.length === 0) {
    return { leads: [], totalRows: 0, validCount: 0, invalidCount: 0 };
  }

  let headerIndex = -1;
  let phoneCol = -1;
  let firstNameCol = -1;
  let lastNameCol = -1;
  let fullNameCol = -1;
  let emailCol = -1;
  let companyCol = -1;
  let bookTopicCol = -1;
  let writingStageCol = -1;
  let contextCol = -1;

  // Scan first 5 rows to detect header
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rowCells = rows[r].map((c) => c.toLowerCase().trim());
    
    for (let c = 0; c < rowCells.length; c++) {
      const cell = rowCells[c];
      if (/^(phone|phonenumber|telephone|mobile|cell|contact_number|phone_number|number|contact)$/i.test(cell) || cell.includes("phone")) {
        phoneCol = c;
      } else if (/^(first_name|firstname|first|fname)$/i.test(cell) || (cell.includes("first") && cell.includes("name"))) {
        firstNameCol = c;
      } else if (/^(last_name|lastname|last|lname|surname)$/i.test(cell) || (cell.includes("last") && cell.includes("name"))) {
        lastNameCol = c;
      } else if (/^(name|author|author_name|full_name|fullname|lead_name|client)$/i.test(cell) || cell === "name") {
        fullNameCol = c;
      } else if (/^(email|email_address|mail|e-mail)$/i.test(cell) || cell.includes("email")) {
        emailCol = c;
      } else if (/^(company|company_name|organization|publisher|org|business)$/i.test(cell) || cell.includes("company")) {
        companyCol = c;
      } else if (/^(book_topic|book_title|book|topic|genre|title|synopsis|project)$/i.test(cell) || cell.includes("book") || cell.includes("title")) {
        bookTopicCol = c;
      } else if (/^(writing_stage|stage|writing_status|phase|manuscript_status)$/i.test(cell) || cell.includes("stage")) {
        writingStageCol = c;
      } else if (/^(context|notes|note|comments|details|instructions|lead_context|summary)$/i.test(cell) || cell.includes("context") || cell.includes("note")) {
        contextCol = c;
      }
    }

    if (phoneCol !== -1 || fullNameCol !== -1 || firstNameCol !== -1) {
      headerIndex = r;
      break;
    }
  }

  // Fallback column positions if no header found
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;
  if (phoneCol === -1) phoneCol = 0;
  if (firstNameCol === -1 && fullNameCol === -1) firstNameCol = 1;

  const parsedLeads: ParsedLeadRow[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c || c.trim() === "")) continue;

    const rawPhone = row[phoneCol] || "";
    let fName = firstNameCol !== -1 ? row[firstNameCol] || "" : "";
    let lName = lastNameCol !== -1 ? row[lastNameCol] || "" : "";

    if (fullNameCol !== -1 && !fName) {
      const full = row[fullNameCol] || "";
      const parts = full.trim().split(/\s+/);
      if (parts.length > 1) {
        fName = parts[0];
        lName = parts.slice(1).join(" ");
      } else {
        fName = full;
        lName = "";
      }
    }

    const email = emailCol !== -1 ? row[emailCol] : undefined;
    const company = companyCol !== -1 ? row[companyCol] : undefined;
    const bookTopic = bookTopicCol !== -1 ? row[bookTopicCol] : undefined;
    const writingStage = writingStageCol !== -1 ? row[writingStageCol] : undefined;
    const context = contextCol !== -1 ? row[contextCol] : undefined;

    const valRes = validateAndNormalizePhone(rawPhone);

    parsedLeads.push({
      rowIndex: i + 1,
      rawPhone,
      phoneNumber: valRes.normalized,
      firstName: fName || "there",
      lastName: lName || "",
      email: email?.trim() || undefined,
      company: company?.trim() || undefined,
      bookTopic: bookTopic?.trim() || undefined,
      writingStage: writingStage?.trim() || undefined,
      context: context?.trim() || undefined,
      isValid: valRes.isValid,
      errorReason: valRes.reason,
    });
  }

  const validCount = parsedLeads.filter((l) => l.isValid).length;
  const invalidCount = parsedLeads.length - validCount;

  return {
    leads: parsedLeads,
    totalRows: parsedLeads.length,
    validCount,
    invalidCount,
  };
}
