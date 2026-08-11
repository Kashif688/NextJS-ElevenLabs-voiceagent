"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare, User, Filter, Search, X } from "lucide-react";

const OUTCOME_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  scheduled_with_senior: { label: "scheduled_with_senior", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  callback_requested: { label: "callback_requested", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  spoke_but_declined: { label: "spoke_but_declined", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  voicemail: { label: "voicemail", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  no_answer: { label: "no_answer", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  wrong_number: { label: "wrong_number", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  busy: { label: "busy", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  hung_up: { label: "hung_up", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  no_info_provided: { label: "no_info_provided", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  call_ended_quickly: { label: "call_ended_quickly", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  other: { label: "other", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  null: { label: "unprocessed / null", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

function formatDuration(seconds: number | undefined) {
  if (!seconds || seconds === 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function extractCallOutcome(item: any, log?: any) {
  if (log?.callOutcome) return log.callOutcome;
  const dataCollection = item?.analysis?.data_collection_results;
  if (dataCollection) {
    const outcomeObj = dataCollection.call_outcome;
    if (typeof outcomeObj === 'string') return outcomeObj;
    if (outcomeObj?.value !== undefined && outcomeObj?.value !== null) return outcomeObj.value;
  }
  const evalCriteria = item?.analysis?.evaluation_criteria_results;
  if (evalCriteria?.call_outcome) {
    const val = evalCriteria.call_outcome.result || evalCriteria.call_outcome.value;
    if (val !== undefined && val !== null) return val;
  }
  const outcome = item?.call_outcome !== undefined && item?.call_outcome !== null ? item.call_outcome : null;
  if (outcome) return outcome;

  // Fallback for voicemail, no answer, short calls when explicit LLM outcome is missing
  const callStatus = String(item?.call_status || item?.status || log?.callStatus || "").toLowerCase();
  const durationSecs = item?.metadata?.call_duration_secs ?? item?.call_duration_secs ?? item?.duration_secs ?? item?.duration ?? log?.callDurationSecs ?? 0;
  const transcript = item?.transcript || [];

  if (callStatus.includes("voicemail")) {
    return "voicemail";
  }
  if (callStatus.includes("no_answer") || callStatus.includes("no answer")) {
    return "no_answer";
  }
  if (callStatus.includes("busy")) {
    return "busy";
  }
  if (callStatus.includes("failed") || callStatus.includes("error")) {
    return "no_answer";
  }
  if (durationSecs < 10 || (Array.isArray(transcript) && transcript.length === 0)) {
    return "call_ended_quickly";
  }

  return "no_info_provided";
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
        const summary = (item.analysis?.transcript_summary || item.transcript_summary || item.summary || log?.callSummary || "").toLowerCase();

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
    { key: "no_answer", label: "no_answer" },
    { key: "wrong_number", label: "wrong_number" },
    { key: "busy", label: "busy" },
    { key: "hung_up", label: "hung_up" },
    { key: "no_info_provided", label: "no_info_provided" },
    { key: "call_ended_quickly", label: "call_ended_quickly" },
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
              <th className="px-5 py-3.5 border-b border-slate-200">Topic / Summary</th>
              <th className="px-5 py-3.5 border-b border-slate-200">call_outcome</th>
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

                const summary = item.analysis?.transcript_summary || item.transcript_summary || item.summary || log?.callSummary;
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

                    {/* Topic / Summary */}
                    <td className={`px-5 py-4 border-b border-slate-200 max-w-[280px] ${isLast ? 'border-none' : ''}`}>
                      {summary ? (
                        <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                          {summary}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No summary</span>
                      )}
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
