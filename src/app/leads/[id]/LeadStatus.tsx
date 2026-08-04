"use client";

import { useState, useEffect } from "react";
import { PlayCircle, Clock, Code2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LeadStatus({ lead, logs }: { lead: any, logs: any[] }) {
  const [isPolling, setIsPolling] = useState(
    ["initiating", "in_progress", "ringing"].includes(lead.callStatus)
  );
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/leads/${lead._id}/check-status`);
          const data = await res.json();
          if (data.updated) {
            router.refresh();
            if (["completed", "failed"].includes(data.call_status)) {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPolling, lead._id, router]);

  // We are on "Call History Timeline" tab by default
  const attemptsCount = logs.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-extrabold text-slate-900">Voice Call Analytics</h2>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[0.75rem] rounded-full">
          {attemptsCount} Attempts
        </span>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 font-bold text-[0.9rem] flex items-center gap-2">
          <Clock size={16} />
          Call History Timeline
        </button>
        <button className="pb-3 text-slate-400 font-bold text-[0.9rem] flex items-center gap-2 hover:text-slate-600 transition-colors">
          <Code2 size={16} />
          Developer Webhook Logs
        </button>
      </div>

      <div className="space-y-6">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            No call attempts have been made yet.
          </div>
        ) : (
          logs.map((log: any, index: number) => {
            const attemptNum = attemptsCount - index; // if sorted latest first
            const isFailed = ["failed", "canceled", "error"].includes((log.callStatus || "").toLowerCase());
            const isCompleted = ["completed", "done"].includes((log.callStatus || "").toLowerCase());

            return (
              <div key={log._id} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-900 mr-2">Attempt #{attemptNum}</span>
                    <span className="text-slate-500 text-[0.8rem] font-medium">• {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${
                    isCompleted ? 'bg-emerald-50 text-emerald-600' :
                    isFailed ? 'bg-red-50 text-red-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {log.callStatus}
                  </span>
                </div>

                <div className="p-5 bg-white">
                  {isFailed ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium text-[0.9rem]">
                      <span className="font-bold">Outcome:</span> {log.callErrorReason || log.callSummary || "Call declined, unanswered, or ended by recipient."}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[0.8rem] font-bold text-[#5c4fff] mb-2 uppercase tracking-wide">AI Call Summary & Transcript</h4>
                        <div className="text-[0.95rem] text-slate-600 leading-relaxed font-medium">
                          {log.callSummary || "Conversation finished successfully."}
                        </div>
                      </div>

                      {log.elevenlabsConversationId && (
                        <div>
                          <h4 className="text-[0.85rem] font-bold text-slate-800 mb-2">Call Audio Playback</h4>
                          <audio controls className="w-full h-10 rounded-full" src={`/api/conversations/${log.elevenlabsConversationId}/audio`}>
                            Your browser does not support the audio element.
                          </audio>
                          
                          <div className="mt-4">
                            <Link href={`/conversations/${log.elevenlabsConversationId}`} className="text-[0.85rem] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 inline-flex">
                              <PlayCircle size={16} />
                              View Full Turn-by-Turn Transcript
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
