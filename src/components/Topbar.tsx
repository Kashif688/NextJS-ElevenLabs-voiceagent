"use client";

import { usePathname } from "next/navigation";
import AgentSwitcher from "./AgentSwitcher";

export default function Topbar({
  agents = [],
  currentAgentId = "",
  currentAgentName = "",
}: {
  agents?: any[];
  currentAgentId?: string;
  currentAgentName?: string;
}) {
  const pathname = usePathname();

  let pageTitle = "Dashboard";
  if (pathname === "/leads") pageTitle = "All Leads";
  if (pathname === "/leads/create") pageTitle = "Create Lead";
  if (pathname === "/conversations") pageTitle = "Conversations";
  if (pathname?.startsWith("/batches")) pageTitle = "Outbound Batches";
  if (pathname === "/agent/settings") pageTitle = "Agent Settings";

  return (
    <header className="h-[70px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center">
        <h2 className="text-[1.25rem] font-bold text-slate-900">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-5">
        <AgentSwitcher agents={agents} currentAgentId={currentAgentId} initialAgentName={currentAgentName} />
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-500 border border-emerald-500/20 rounded-full text-sm font-bold shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_0_0_rgba(16,185,129,0.7)]"></span>
          <span>ElevenLabs Agent Online</span>
        </div>
      </div>
    </header>
  );
}
