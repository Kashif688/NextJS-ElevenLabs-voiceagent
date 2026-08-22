"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Layers, 
  Sparkles, 
  Users, 
  PhoneCall,
  Info
} from "lucide-react";
import { parseDelimitedText, parseLeadSheetData, ParsedLeadRow } from "@/lib/excelParser";
import { importLeadsAction } from "@/actions/lead.actions";
import toast from "react-hot-toast";

interface Props {
  currentAgentId?: string;
}

export default function ImportLeadsModal({ currentAgentId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLeadRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // Import options
  const [mode, setMode] = useState<"crm_only" | "launch_batch">("crm_only");
  const [batchName, setBatchName] = useState(
    `Batch Campaign - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFileName(null);
    setParsedLeads([]);
    setValidCount(0);
    setInvalidCount(0);
    setMode("crm_only");
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    resetState();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      try {
        const XLSX = await import("xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        
        const result = parseLeadSheetData(rawRows);
        setParsedLeads(result.leads);
        setValidCount(result.validCount);
        setInvalidCount(result.invalidCount);
        return;
      } catch (err) {
        console.error("Failed to parse Excel file", err);
        toast.error("Failed to parse Excel file.");
        return;
      }
    }

    // Standard CSV/Delimited text reading
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("File is empty.");
        return;
      }
      const rawRows = parseDelimitedText(text);
      const result = parseLeadSheetData(rawRows);
      setParsedLeads(result.leads);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    const validLeads = parsedLeads.filter((l) => l.isValid);
    if (validLeads.length === 0) {
      toast.error("No valid lead phone numbers found to import.");
      return;
    }

    if (mode === "launch_batch" && !batchName.trim()) {
      toast.error("Please enter a campaign name for the batch call.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading(
      mode === "launch_batch"
        ? `Importing ${validLeads.length} leads & launching batch...`
        : `Importing ${validLeads.length} leads to CRM...`
    );

    try {
      const payload = {
        leads: validLeads.map((l) => ({
          phoneNumber: l.phoneNumber,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.email,
          company: l.company,
          bookTopic: l.bookTopic,
          writingStage: l.writingStage,
          context: l.context,
        })),
        launchBatch: mode === "launch_batch",
        batchName: mode === "launch_batch" ? batchName.trim() : undefined,
        agentId: currentAgentId,
      };

      const res = await importLeadsAction(payload);

      if (res.success) {
        toast.success(
          mode === "launch_batch"
            ? `Successfully imported ${res.importedCount} leads and launched batch call!`
            : `Successfully imported ${res.importedCount} leads into CRM!`,
          { id: loadingToast }
        );
        handleClose();
      } else {
        toast.error(res.error || "Failed to import leads.", { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm hover:border-slate-300"
      >
        <FileSpreadsheet size={18} className="text-emerald-600" />
        Import Excel / CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Import Leads from Spreadsheet</h3>
                  <p className="text-xs text-slate-500 font-medium">Upload .xlsx, .xls, or .csv files with author details & context</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-7 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* File Upload Box */}
              {!fileName ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/20 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Click to upload or drag & drop</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) with headers like Name, Phone, Email, Book Topic, Context
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-950 truncate max-w-md">{fileName}</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {validCount} valid lead{validCount === 1 ? "" : "s"} ready
                        {invalidCount > 0 && ` • ${invalidCount} invalid row(s)`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetState}
                    disabled={loading}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Mode Selection Choice */}
              {parsedLeads.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Choose Import Action
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: CRM Only */}
                    <div
                      onClick={() => setMode("crm_only")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        mode === "crm_only"
                          ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                          mode === "crm_only" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {mode === "crm_only" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Users size={16} className="text-indigo-600" />
                            Save to Leads CRM Only
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                            Imports rows directly into your CRM for record keeping, history tracking, and manual outreach.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Launch Batch */}
                    <div
                      onClick={() => setMode("launch_batch")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        mode === "launch_batch"
                          ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                          mode === "launch_batch" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {mode === "launch_batch" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                            <PhoneCall size={16} className="text-indigo-600" />
                            Launch as Batch Calling Campaign
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                            Saves to Leads CRM <strong>AND</strong> immediately initiates an automated calling campaign on ElevenLabs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Batch Name Input if Launch Batch Selected */}
                  {mode === "launch_batch" && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                      <label className="block text-xs font-bold text-slate-700">
                        Batch Campaign Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="e.g. Author Outreach Q3 - Fiction Authors"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedLeads.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Spreadsheet Data Preview ({parsedLeads.length} rows)
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {validCount} valid E.164 numbers
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[260px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="px-3.5 py-2.5">#</th>
                          <th className="px-3.5 py-2.5">Name</th>
                          <th className="px-3.5 py-2.5">Phone (E.164)</th>
                          <th className="px-3.5 py-2.5">Email</th>
                          <th className="px-3.5 py-2.5">Book Topic / Context</th>
                          <th className="px-3.5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {parsedLeads.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-red-50/40"}>
                            <td className="px-3.5 py-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-3.5 py-2 font-bold text-slate-900">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="px-3.5 py-2 font-mono">{row.phoneNumber || row.rawPhone}</td>
                            <td className="px-3.5 py-2">{row.email || "-"}</td>
                            <td className="px-3.5 py-2 truncate max-w-[200px]" title={row.context || row.bookTopic || ""}>
                              {row.bookTopic || row.context || "-"}
                            </td>
                            <td className="px-3.5 py-2">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 size={12} /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md" title={row.errorReason}>
                                  <AlertCircle size={12} /> Invalid Phone
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium">
                {validCount > 0 ? `${validCount} leads will be imported` : "Upload a sheet to get started"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={loading || validCount === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === "launch_batch" ? "Import & Launch Batch" : "Import Leads to CRM"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
