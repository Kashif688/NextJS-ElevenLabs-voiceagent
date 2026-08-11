import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';

async function main() {
  // 1. Read Batch CSV
  const batchCsvPath = "C:\\Users\\Kashif\\Downloads\\batch-call-btcal_8201kzp9snx2ejb9myz3rqs3dq2k (1).csv";
  console.log(`Reading Batch CSV: ${batchCsvPath}`);
  
  if (!fs.existsSync(batchCsvPath)) {
    console.error("Batch CSV not found!");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(batchCsvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  const targetPhones = new Set<string>();
  
  for (const record of records as any[]) {
    let phone = record.phone_number;
    if (phone && phone.startsWith("'")) {
      phone = phone.substring(1);
    }
    if (!phone) continue;

    const status = String(record.status || "").toLowerCase();
    const duration = parseInt(record.conversation_duration_seconds || "0", 10);
    
    // Outcome Logic (matching the dashboard)
    let outcome = "no_info_provided";
    if (status.includes("voicemail")) outcome = "voicemail";
    else if (status.includes("no-answer") || status.includes("no_answer")) outcome = "no_answer";
    else if (status.includes("busy")) outcome = "busy";
    else if (status.includes("failed") || status.includes("error")) outcome = "failed";
    else if (duration < 10) outcome = "call_ended_quickly";

    // Keep numbers that had these specific outcomes
    if (["no_info_provided", "no_answer", "call_ended_quickly"].includes(outcome)) {
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      targetPhones.add(normalizedPhone);
    }
  }
  
  console.log(`Found ${targetPhones.size} target phone numbers to recall (no_answer, call_ended_quickly, no_info_provided).`);

  // 2. Read Original Excel Sheet
  const excelPath = "C:\\Users\\Kashif\\Downloads\\finaled_leads.xlsx";
  console.log(`Reading original Excel: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.error("Original Excel file not found!");
    process.exit(1);
  }

  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`Original Excel has ${rows.length} rows.`);

  // 3. Filter Rows
  const recalledRows = rows.filter(row => {
    let phoneValue = "";
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("no")) {
        phoneValue = String(row[key]);
        if (phoneValue.replace(/\D/g, '').length >= 10) break;
      }
    }
    
    if (!phoneValue) return false;
    
    const normalizedRowPhone = phoneValue.replace(/\D/g, '').slice(-10);
    return targetPhones.has(normalizedRowPhone);
  });

  console.log(`Filtered down to ${recalledRows.length} rows for the new batch.`);

  if (recalledRows.length === 0) {
    console.log("No rows matched! Double check the data mapping.");
  }

  // 4. Write to new CSV
  const outputPath = "C:\\Users\\Kashif\\Downloads\\recalled_leads_for_batch.csv";
  const newSheet = xlsx.utils.json_to_sheet(recalledRows);
  const newWorkbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Recalled Leads");
  
  xlsx.writeFile(newWorkbook, outputPath, { bookType: 'csv' });
  
  console.log(`Successfully wrote the reconstructed CSV to: ${outputPath}`);
}

main().catch(console.error);
