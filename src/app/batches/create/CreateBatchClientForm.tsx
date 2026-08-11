"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Sparkles, 
  PhoneCall, 
  Trash2,
  Filter
} from "lucide-react";
import { createBatchCallAction } from "@/actions/batch.actions";
import toast from "react-hot-toast";

interface Props {
  leads: any[];
  currentAgentId: string;
  currentAgentName: string;
}

interface CsvRowPreview {
  rowIndex: number;
  rawPhone: string;
  normalizedPhone: string;
  firstName?: string;
  isValid: boolean;
  errorReason?: string;
}

export default function CreateBatchClientForm({ leads, currentAgentId, currentAgentName }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [callName, setCallName] = useState("");
  const [activeTab, setActiveTab] = useState<"crm" | "manual" | "csv">("crm");

  // CRM Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Input State
  const [manualInput, setManualInput] = useState("");

  // CSV Upload State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvPreviews, setCsvPreviews] = useState<CsvRowPreview[]>([]);

  // Filtered leads by search query
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    const phone = lead.phoneNumber.toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l._id));
    }
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // E.164 Phone Validator
  const validateAndNormalizePhone = (phoneStr: string): { normalized: string; isValid: boolean; reason?: string } => {
    if (!phoneStr) return { normalized: "", isValid: false, reason: "Empty phone number" };
    
    let clean = phoneStr.trim().replace(/[\s\-\(\)]/g, "");
    if (!clean.startsWith("+")) {
      // If user typed e.g. 17706298005 or 7706298005, prefix with +
      if (clean.length === 10) clean = "+1" + clean;
      else if (clean.length === 11 && clean.startsWith("1")) clean = "+" + clean;
      else clean = "+" + clean;
    }

    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!phoneRegex.test(clean)) {
      return {
        normalized: clean,
        isValid: false,
        reason: "Invalid format. Must be E.164 e.g. +17706298005",
      };
    }

    return { normalized: clean, isValid: true };
  };

  // Handle CSV File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        toast.error("The uploaded CSV file is empty.");
        return;
      }

      let startIndex = 0;
      let phoneColIdx = 0;
      let nameColIdx = 1;

      // Detect header row
      const firstLineParts = lines[0].split(/[,;\t]/).map((p) => p.trim().toLowerCase());
      const hasHeader = firstLineParts.some((p) => p.includes("phone") || p.includes("name") || p.includes("number"));

      if (hasHeader) {
        startIndex = 1;
        const pIdx = firstLineParts.findIndex((p) => p.includes("phone") || p.includes("number"));
        const nIdx = firstLineParts.findIndex((p) => p.includes("name") || p.includes("first"));
        if (pIdx !== -1) phoneColIdx = pIdx;
        if (nIdx !== -1) nameColIdx = nIdx;
      }

      const rows: CsvRowPreview[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
        const rawPhone = parts[phoneColIdx] || parts[0] || "";
        const nameVal = parts[nameColIdx] !== rawPhone ? parts[nameColIdx] : undefined;

        const valRes = validateAndNormalizePhone(rawPhone);

        rows.push({
          rowIndex: i + 1,
          rawPhone,
          normalizedPhone: valRes.normalized,
          firstName: nameVal,
          isValid: valRes.isValid,
          errorReason: valRes.reason,
        });
      }

      setCsvPreviews(rows);
      toast.success(`Parsed ${rows.length} rows from ${file.name}`);
    };

    reader.readAsText(file);
  };

  // Remove invalid rows from CSV preview
  const filterInvalidCsvRows = () => {
    const validOnly = csvPreviews.filter((r) => r.isValid);
    setCsvPreviews(validOnly);
    toast.success("Filtered out invalid rows!");
  };

  // Clear CSV Upload
  const clearCsvUpload = () => {
    setCsvFileName(null);
    setCsvPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Process Manual Input
  const parseManualRecipients = () => {
    const lines = manualInput.split("\n");
    const result: Array<{ phoneNumber: string; firstName?: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/[,;\t]/);
      const rawPhone = parts[0].trim();
      const firstName = parts[1]?.trim();
      
      const valRes = validateAndNormalizePhone(rawPhone);
      if (valRes.isValid) {
        result.push({ phoneNumber: valRes.normalized, firstName });
      }
    });

    return result;
  };

  // Get total valid recipients
  const crmRecipients = leads
    .filter((l) => selectedLeadIds.includes(l._id))
    .map((l) => ({ phoneNumber: l.phoneNumber, firstName: l.firstName }));

  const manualRecipients = parseManualRecipients();

  const validCsvRecipients = csvPreviews
    .filter((r) => r.isValid)
    .map((r) => ({ phoneNumber: r.normalizedPhone, firstName: r.firstName }));

  const invalidCsvCount = csvPreviews.filter((r) => !r.isValid).length;

  const finalRecipients =
    activeTab === "crm"
      ? crmRecipients
      : activeTab === "manual"
      ? manualRecipients
      : validCsvRecipients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!callName.trim()) {
      toast.error("Please enter a campaign name for this batch call.");
      return;
    }

    if (activeTab === "csv" && invalidCsvCount > 0) {
      toast.error("Please filter out or fix invalid CSV phone numbers before submitting.");
      return;
    }

    if (finalRecipients.length === 0) {
      toast.error(
        activeTab === "crm"
          ? "Please select at least one lead from your database."
          : activeTab === "manual"
          ? "Please enter at least one valid phone number."
          : "Please upload a valid CSV file with recipient phone numbers."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await createBatchCallAction({
        callName: callName.trim(),
        agentId: currentAgentId,
        recipients: finalRecipients,
      });

      if (res.success) {
        toast.success("Batch call job launched successfully!");
        router.push("/batches");
      } else {
        toast.error(res.error || "Failed to launch batch call job.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Navigation */}
      <Link href="/batches" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} />
        Back to All Batches
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create New Outbound Batch</h1>
          <p className="text-slate-500 text-sm mt-1">
            Dispatch bulk AI voice calls to target authors & leads via ElevenLabs ConvAI.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/60 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          Active Agent: {currentAgentName}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            1. Campaign & Agent Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Batch Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Author Outreach Campaign #1"
                value={callName}
                onChange={(e) => setCallName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Voice Agent ID
              </label>
              <input
                type="text"
                disabled
                value={`${currentAgentName} (${currentAgentId || "Default Agent"})`}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Recipients Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                2. Select Call Recipients
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose contacts from your CRM, paste numbers, or upload a validated CSV file.
              </p>
            </div>

            {/* Recipient Source Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("crm")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "crm"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                CRM Database ({leads.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "manual"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("csv")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "csv"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload CSV
              </button>
            </div>
          </div>

          {/* TAB 1: CRM DATABASE LEADS */}
          {activeTab === "crm" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search leads by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0
                    ? "Deselect All"
                    : "Select All Filtered"}
                </button>
              </div>

              {/* Leads Table */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No leads found matching "{searchQuery}".
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead._id);
                    return (
                      <div
                        key={lead._id}
                        onClick={() => toggleLead(lead._id)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{lead.phoneNumber}</p>
                          </div>
                        </div>
                        <span className="text-[0.75rem] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">
                          {lead.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL INPUT */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Paste Phone Numbers (One per line or `+Phone, Name`)
              </label>
              <textarea
                rows={6}
                placeholder={`+17706298005, John Doe\n+14045550199, Jane Smith\n+18005550123`}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
              <p className="text-[0.75rem] text-slate-400">
                Tip: Format as <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">+1234567890, First Name</code> to include recipient names as dynamic variables in the call.
              </p>
            </div>
          )}

          {/* TAB 3: UPLOAD CSV & VALIDATION PREVIEW */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!csvFileName ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Click to upload CSV recipient file</p>
                    <p className="text-xs text-slate-500 mt-0.5">Supports .csv files with phone numbers & names</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Upload File Badge & Controls */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet size={20} className="text-indigo-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{csvFileName}</p>
                        <p className="text-xs text-slate-500">
                          {csvPreviews.length} rows parsed • {validCsvRecipients.length} valid E.164 numbers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {invalidCsvCount > 0 && (
                        <button
                          type="button"
                          onClick={filterInvalidCsvRows}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Filter size={14} />
                          Remove Invalid Rows ({invalidCsvCount})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={clearCsvUpload}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* CSV Validation Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                      <span>CSV Recipient Validation Preview</span>
                      <span className="text-slate-500 font-mono">{csvPreviews.length} Total Rows</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {csvPreviews.map((row) => (
                        <div
                          key={row.rowIndex}
                          className={`px-4 py-3 flex items-center justify-between text-xs transition-colors ${
                            row.isValid ? "bg-white" : "bg-red-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-400 w-8">#{row.rowIndex}</span>
                            <div>
                              <span className="font-mono font-bold text-slate-900">{row.normalizedPhone || row.rawPhone}</span>
                              {row.firstName && (
                                <span className="text-slate-500 ml-2">({row.firstName})</span>
                              )}
                            </div>
                          </div>

                          <div>
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[0.75rem] font-bold">
                                <CheckCircle2 size={14} />
                                Valid Number
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200/60 rounded-full text-[0.75rem] font-bold">
                                <XCircle size={14} />
                                {row.errorReason}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Launch Banner & Submit Footer */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
              Batch Summary
            </span>
            <p className="text-xl font-extrabold mt-0.5">
              {finalRecipients.length} Recipient{finalRecipients.length === 1 ? "" : "s"} Ready
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || finalRecipients.length === 0 || (activeTab === "csv" && invalidCsvCount > 0)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:-translate-y-px disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Dispatching Batch Call...
              </>
            ) : (
              <>
                <PhoneCall size={18} />
                Launch Batch Call Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
