"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare, User, Filter, Search, X } from "lucide-react";

const OUTCOME_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  scheduled_with_senior: { label: "scheduled_with_senior", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  plans_emailed: { label: "plans_emailed", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  contract_sent: { label: "contract_sent", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  spoke_but_declined: { label: "spoke_but_declined", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  not_interestd_hangup: { label: "not_interestd_hangup", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  not_interested_hangup: { label: "not_interested_hangup", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  busy_hangup: { label: "busy_hangup", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ai_objection_hangup: { label: "ai_objection_hangup", bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  immediate_hangup: { label: "immediate_hangup", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  speak_no_word: { label: "speak_no_word", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  voicemail: { label: "voicemail", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  callback_requested: { label: "callback_requested", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  no_answer: { label: "no_answer", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  wrong_number_hangup: { label: "wrong_number_hangup", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  wrong_number: { label: "wrong_number", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  busy: { label: "busy", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  hung_up: { label: "hung_up", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  call_ended_quickly: { label: "call_ended_quickly", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  no_info_provided: { label: "no_info_provided", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  not_evaluated: { label: "not_evaluated", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
  failed: { label: "failed", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  other: { label: "other", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  null: { label: "unprocessed", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

function formatDuration(seconds: number | undefined) {
  if (!seconds || seconds === 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function extractOutcomeString(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '[object Object]' || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
    return trimmed;
  }
  if (typeof val === 'object') {
    if (val.value && typeof val.value === 'string') return val.value.trim();
    if (val.result && typeof val.result === 'string') return val.result.trim();
    if (val.response && typeof val.response === 'string') return val.response.trim();
    return null;
  }
  return String(val);
}

function extractCallOutcome(item: any, log?: any) {
  const callStatus = String(item?.recipientStatus || item?.call_status || item?.status || log?.callStatus || "").toLowerCase();

  // 1. Prioritize telephony status
  if (callStatus.includes("voicemail")) {
    return "voicemail";
  }
  if (callStatus.includes("no_answer") || callStatus.includes("no answer")) {
    return "no_answer";
  }
  if (callStatus.includes("busy")) {
    return "busy_hangup";
  }
  if (callStatus.includes("failed") || callStatus.includes("error")) {
    return "failed";
  }

  // 2. Check Database Log outcome
  const logOutcome = extractOutcomeString(log?.callOutcome);
  if (logOutcome && logOutcome !== "call_ended_quickly" && logOutcome !== "no_info_provided") {
    return logOutcome;
  }

  // 3. Check ElevenLabs LLM Data Collection Results
  const dataCollection = item?.analysis?.data_collection_results;
  const llmOutcome = extractOutcomeString(dataCollection?.call_outcome);
  if (llmOutcome && llmOutcome !== "call_ended_quickly" && llmOutcome !== "no_info_provided") {
    return llmOutcome;
  }

  // 4. Check Evaluation Criteria Results
  const evalCriteria = item?.analysis?.evaluation_criteria_results;
  const evalOutcome = extractOutcomeString(evalCriteria?.call_outcome);
  if (evalOutcome && evalOutcome !== "call_ended_quickly" && evalOutcome !== "no_info_provided") {
    return evalOutcome;
  }

  // 5. Check if transcript was empty
  const transcript = item?.transcript || [];
  const durationSecs = item?.metadata?.call_duration_secs ?? item?.call_duration_secs ?? item?.duration_secs ?? item?.duration ?? log?.callDurationSecs ?? 0;
  if (Array.isArray(transcript) && transcript.length === 0 && durationSecs > 0) {
    return "speak_no_word";
  }

  // 6. Return LLM value if present
  if (llmOutcome) {
    if (llmOutcome === "no_info_provided") return "not_evaluated";
    return llmOutcome;
  }
  if (evalOutcome) {
    if (evalOutcome === "no_info_provided") return "not_evaluated";
    return evalOutcome;
  }
  if (logOutcome) {
    if (logOutcome === "no_info_provided") return "not_evaluated";
    return logOutcome;
  }

  return "not_evaluated";
}

function extractOneLineSummary(item: any, log?: any): string | null {
  const dataCollection = item?.analysis?.data_collection_results;
  const oneLine = dataCollection?.one_line_summary;
  const val = extractOutcomeString(oneLine);
  if (val) return val;

  if (log?.oneLineSummary) return log.oneLineSummary;
  if (item?.one_line_summary) return item.one_line_summary;

  return item?.analysis?.transcript_summary || item?.transcript_summary || item?.summary || log?.callSummary || null;
}

export default function BatchConversationsList({
  recipients = [],
  callLogs = [],
  selectedFilter = "all",
  onSelectFilter,
}: {
  recipients: any[];
  callLogs: any[];
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
}) {
  const [internalFilter, setInternalFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeFilter = onSelectFilter ? selectedFilter : internalFilter;
  const setFilter = (val: string) => {
    if (onSelectFilter) {
      onSelectFilter(val);
    } else {
      setInternalFilter(val);
    }
  };

  const callLogMap = useMemo(() => {
    return new Map(callLogs.map((l: any) => [l.elevenlabsConversationId, l]));
  }, [callLogs]);

  // Compute outcome counts for filter pills
  const outcomeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: recipients.length };
    recipients.forEach((item: any) => {
      const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
      const log = convId ? callLogMap.get(convId) : null;
      const outcome = extractCallOutcome(item, log) || "null";
      counts[outcome] = (counts[outcome] || 0) + 1;
    });
    return counts;
  }, [recipients, callLogMap]);

  // Filtered List
  const filteredRecipients = useMemo(() => {
    return recipients.filter((item: any) => {
      const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
      const log = convId ? callLogMap.get(convId) : null;
      const outcome = extractCallOutcome(item, log) || "null";

      // 1. Outcome Filter
      if (activeFilter !== "all" && outcome !== activeFilter) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const phoneNumber = (item.phone_number || item.to_number || item.recipient_phone_number || log?.leadId?.phoneNumber || "").toLowerCase();
        const name = (item.name || item.recipient_name || (log?.leadId ? `${log.leadId.firstName} ${log.leadId.lastName}` : "")).toLowerCase();
        const summary = (extractOneLineSummary(item, log) || "").toLowerCase();

        return phoneNumber.includes(q) || name.includes(q) || summary.includes(q);
      }

      return true;
    });
  }, [recipients, callLogMap, activeFilter, searchQuery]);

  const filterOptions = [
    { key: "all", label: "All Outcomes" },
    { key: "scheduled_with_senior", label: "scheduled_with_senior" },
    { key: "callback_requested", label: "callback_requested" },
    { key: "spoke_but_declined", label: "spoke_but_declined" },
    { key: "plans_emailed", label: "plans_emailed" },
    { key: "contract_sent", label: "contract_sent" },
    { key: "transfered_billing", label: "transfered_billing" },
    { key: "voicemail", label: "voicemail" },
    { key: "no_answer", label: "no_answer" },
    { key: "wrong_number_hangup", label: "wrong_number_hangup" },
    { key: "busy_hangup", label: "busy_hangup" },
    { key: "not_interestd_hangup", label: "not_interested_hangup" },
    { key: "not_interested_hangup", label: "not_interested_hangup" },
    { key: "immediate_hangup", label: "immediate_hangup" },
    { key: "ai_objection_hangup", label: "ai_objection_hangup" },
    { key: "speak_no_word", label: "speak_no_word" },
    { key: "call_ended_quickly", label: "call_ended_quickly" },
    { key: "not_evaluated", label: "not_evaluated" },
    { key: "failed", label: "failed" },
    { key: "other", label: "other" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            Conversations in this Batch
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredRecipients.length} of {recipients.length} calls
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search phone, recipient, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Outcome Filter Dropdown & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        {/* Dropdown Filter */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider shrink-0">
            <Filter size={15} className="text-indigo-600" />
            Filter Outcome:
          </div>

          <div className="relative flex-1 max-w-sm">
            <select
              value={activeFilter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none shadow-sm cursor-pointer transition-all"
            >
              {filterOptions.map((opt) => {
                const count = outcomeCounts[opt.key] || 0;
                return (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} ({count})
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {activeFilter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors flex items-center gap-1 shrink-0"
              title="Clear Filter"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Selected Outcome Badge Indicator */}
        {activeFilter !== "all" && (
          <div className="shrink-0 flex items-center">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-sm ${
              OUTCOME_CONFIG[activeFilter]
                ? `${OUTCOME_CONFIG[activeFilter].bg} ${OUTCOME_CONFIG[activeFilter].text} ${OUTCOME_CONFIG[activeFilter].border}`
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}>
              Active: {activeFilter} ({outcomeCounts[activeFilter] || 0})
            </span>
          </div>
        )}
      </div>

      {/* Conversations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-slate-50 text-slate-500 text-[0.75rem] font-bold uppercase tracking-[0.05em]">
            <tr>
              <th className="px-5 py-3.5 border-b border-slate-200 rounded-tl-lg">Recipient / Phone</th>
              <th className="px-5 py-3.5 border-b border-slate-200">Call Status</th>
              <th className="px-5 py-3.5 border-b border-slate-200">call_outcome</th>
              <th className="px-5 py-3.5 border-b border-slate-200">one_line_summary</th>
              <th className="px-5 py-3.5 border-b border-slate-200">Duration</th>
              <th className="px-5 py-3.5 border-b border-slate-200 rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody className="text-[0.9rem] text-slate-700">
            {filteredRecipients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">No calls match the selected filter.</p>
                    <p className="text-xs text-slate-400">Try selecting a different outcome or resetting filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecipients.map((item: any, index: number) => {
                const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
                const log = convId ? callLogMap.get(convId) : null;
                const phoneNumber = item.phone_number || item.to_number || item.recipient_phone_number || log?.leadId?.phoneNumber || "N/A";
                const name = item.name || item.recipient_name || (log?.leadId ? `${log.leadId.firstName} ${log.leadId.lastName}` : "Recipient");
                const callStatus = item.recipientStatus || item.call_status || item.status || "completed";
                const isLast = index === filteredRecipients.length - 1;

                const oneLineSummary = extractOneLineSummary(item, log);
                const outcome = extractCallOutcome(item, log);
                const durationSecs =
                  item.metadata?.call_duration_secs ??
                  item.call_duration_secs ??
                  item.duration_secs ??
                  item.duration ??
                  0;

                const cfg = outcome && OUTCOME_CONFIG[outcome] ? OUTCOME_CONFIG[outcome] : OUTCOME_CONFIG["null"];

                return (
                  <tr key={convId || index} className="hover:bg-slate-50 transition-colors">
                    {/* Recipient / Phone */}
                    <td className={`px-5 py-4 font-bold border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold">{name}</p>
                          <p className="text-xs text-slate-500 font-mono">{phoneNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Delivery Status */}
                    <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        String(callStatus).toLowerCase().includes('voicemail') ? 'bg-pink-50 text-pink-700 border border-pink-200/80' :
                        String(callStatus).toLowerCase().includes('completed') || String(callStatus).toLowerCase().includes('done') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                        String(callStatus).toLowerCase().includes('no_answer') || String(callStatus).toLowerCase().includes('no answer') ? 'bg-blue-50 text-blue-700 border border-blue-200/80' :
                        String(callStatus).toLowerCase().includes('busy') ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                        String(callStatus).toLowerCase().includes('failed') || String(callStatus).toLowerCase().includes('error') ? 'bg-red-50 text-red-600 border border-red-200/80' :
                        'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
                      }`}>
                        {callStatus}
                      </span>
                    </td>

                    {/* call_outcome */}
                    <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                      {outcome === null || outcome === undefined ? (
                        <span className="text-slate-400 italic text-xs">null</span>
                      ) : (
                        <span className={`px-2.5 py-1 ${cfg.bg} ${cfg.text} border ${cfg.border} rounded-lg text-xs font-mono font-semibold`}>
                          {String(outcome)}
                        </span>
                      )}
                    </td>

                    {/* one_line_summary */}
                    <td className={`px-5 py-4 border-b border-slate-200 max-w-[280px] ${isLast ? 'border-none' : ''}`}>
                      {oneLineSummary ? (
                        <div>
                          <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                            {oneLineSummary}
                          </p>
                          {log?.preferredCallbackTime && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                              📅 Callback: {log.preferredCallbackTime}
                            </div>
                          )}
                        </div>
                      ) : log?.preferredCallbackTime ? (
                        <div className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                          📅 Callback: {log.preferredCallbackTime}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No summary</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className={`px-5 py-4 border-b border-slate-200 text-xs text-slate-600 font-semibold ${isLast ? 'border-none' : ''}`}>
                      {formatDuration(durationSecs)}
                    </td>

                    {/* Action */}
                    <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                      {convId ? (
                        <Link
                          href={`/conversations/${convId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[0.8rem] font-semibold transition-colors"
                        >
                          <MessageSquare size={14} />
                          View Transcript
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No transcript</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
