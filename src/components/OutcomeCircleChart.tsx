"use client";

import React, { useState } from "react";
import { PhoneCall, Sparkles } from "lucide-react";

export interface OutcomeItem {
  key: string;
  label: string;
  count: number;
  color: string;
  percentage: number;
}

export default function OutcomeCircleChart({ 
  statusData = [],
  outcomeData = [],
  onSelectOutcome
}: { 
  statusData?: OutcomeItem[];
  outcomeData?: OutcomeItem[];
  onSelectOutcome?: (key: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"status" | "outcome">("status");
  const [activeItem, setActiveItem] = useState<OutcomeItem | null>(null);

  const currentData = activeTab === "status" ? statusData : outcomeData;
  const total = currentData.reduce((acc, item) => acc + item.count, 0);

  if (total === 0 || currentData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <p className="text-sm font-semibold text-slate-600">No Analytics Data Available</p>
        <p className="text-xs text-slate-400 mt-0.5">Call stats will populate here once calls complete.</p>
      </div>
    );
  }

  // Calculate SVG stroke-dasharray segments for donut chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.82
  let accumulatedPercent = 0;

  const segments = currentData.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
      {/* 2-Level Breakdown Toggle Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Batch Analytics & Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between raw call connection status and ElevenLabs LLM conversation outcomes
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
          <button
            onClick={() => {
              setActiveTab("status");
              setActiveItem(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "status"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PhoneCall size={13} className={activeTab === "status" ? "text-indigo-600" : "text-slate-400"} />
            1. Connection Status (Voicemail / Answer)
          </button>

          <button
            onClick={() => {
              setActiveTab("outcome");
              setActiveItem(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "outcome"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles size={13} className={activeTab === "outcome" ? "text-purple-600" : "text-slate-400"} />
            2. LLM Conversation Outcomes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* SVG Donut Chart Widget */}
        <div className="relative w-52 h-52 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r={radius}
              className="text-slate-100"
              strokeWidth="20"
              stroke="currentColor"
              fill="transparent"
            />
            {segments.map((seg, idx) => (
              <circle
                key={seg.key || idx}
                cx="90"
                cy="90"
                r={radius}
                stroke={seg.color}
                strokeWidth={activeItem?.key === seg.key ? "24" : "20"}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="butt"
                fill="transparent"
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setActiveItem(seg)}
                onMouseLeave={() => setActiveItem(null)}
                onClick={() => onSelectOutcome && onSelectOutcome(seg.key)}
              />
            ))}
          </svg>
          
          {/* Donut Center Label (Safely Truncated & Formatted) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
              {activeItem ? activeItem.count : total}
            </span>
            <span 
              className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 max-w-[120px] truncate leading-snug mt-0.5"
              title={activeItem ? activeItem.label : (activeTab === "status" ? "TOTAL CALLS" : "ANSWERED CALLS")}
            >
              {activeItem ? activeItem.label : (activeTab === "status" ? "TOTAL CALLS" : "TRACKED CALLS")}
            </span>
            {activeItem && (
              <span 
                className="text-xs font-black px-2 py-0.5 rounded-full mt-1 font-mono"
                style={{ backgroundColor: `${activeItem.color}15`, color: activeItem.color }}
              >
                {activeItem.percentage < 1 && activeItem.percentage > 0 
                  ? `${activeItem.percentage.toFixed(1)}%` 
                  : `${Math.round(activeItem.percentage)}%`}
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Legend Grid with Progress Indicators */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {activeTab === "status" ? "ElevenLabs Delivery Status Breakdown" : "Conversation Outcome Breakdown (LLM Data Collection)"}
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {total} Total Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {currentData.map((item) => {
              const isHovered = activeItem?.key === item.key;
              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setActiveItem(item)}
                  onMouseLeave={() => setActiveItem(null)}
                  onClick={() => onSelectOutcome && onSelectOutcome(item.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isHovered
                      ? "bg-slate-50 border-indigo-200 shadow-sm scale-[1.01]"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-extrabold text-slate-800 truncate font-mono">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-right shrink-0">
                      <span className="text-xs font-black text-slate-900">{item.count}</span>
                      <span className="text-[0.7rem] font-bold text-slate-400 font-mono">
                        ({item.percentage < 1 && item.percentage > 0 ? item.percentage.toFixed(1) : Math.round(item.percentage)}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 2)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
