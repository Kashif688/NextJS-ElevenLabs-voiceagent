"use client";

import { useTransition, useState, useEffect } from "react";
import { switchAgent } from "@/actions/agent.actions";

// Default agents configuration
const agents = [
  {
    id: "default", // We'll map this to process.env.AGENT_ID on the server if needed, or just leave it empty to trigger fallback
    name: "Consultant (Default)",
  },
  {
    id: "agent_8401kz69arjce8daj1gtr08vdn8q",
    name: "Sales agent",
  }
];

export default function AgentSwitcher({ currentAgentId }: { currentAgentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Determine current active agent name
  const currentAgent = agents.find(a => a.id === currentAgentId) || agents[0];

  const handleSwitch = (agentId: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await switchAgent(agentId === "default" ? "" : agentId);
      // Optional: you can add a toast here
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-full text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'}`}></div>
        <span>{isPending ? "Switching..." : currentAgent.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSwitch(agent.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  (currentAgentId === agent.id || (agent.id === "default" && !agents.some(a => a.id === currentAgentId && a.id !== "default")))
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
