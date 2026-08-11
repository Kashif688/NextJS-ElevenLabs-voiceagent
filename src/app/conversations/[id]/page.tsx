import { getConversationDetails, getAgentDetails } from "@/lib/elevenlabs";
import Link from "next/link";
import { ArrowLeft, User, Bot } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number | undefined) {
  if (!seconds) return "0m 0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(unixSecs: number | undefined) {
  if (!unixSecs) return "N/A";
  const d = new Date(unixSecs * 1000);
  return d.toLocaleDateString("en-US", { 
    month: "short", 
    day: "2-digit", 
    year: "numeric" 
  }) + " at " + d.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit",
    hour12: false 
  });
}

function formatTimeInCall(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default async function ConversationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const conversationId = resolvedParams.id;
  
  const conversation = await getConversationDetails(conversationId);
  
  if (!conversation) {
    notFound();
  }

  // Attempt to fetch agent name if agent_id is available
  let agentName = "ElevenLabs Agent";
  if (conversation.agent_id) {
    const agent = await getAgentDetails(conversation.agent_id);
    if (agent?.name) agentName = agent.name;
  }

  const transcript = conversation.transcript || [];
  const status = (conversation.status || 'unknown').toLowerCase();
  const duration = conversation.call_duration_secs;
  const startTime = conversation.start_time_unix_secs;

  return (
    <div className="max-w-[1300px] mx-auto pt-4 pb-12">
      <div className="mb-6">
        <Link href="/conversations" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[0.85rem] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white">
          <ArrowLeft size={16} />
          Back to All Conversations
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Call Metadata */}
        <div className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8 shrink-0 sticky top-[100px]">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 pb-4 border-b border-slate-100">Call Metadata</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[0.85rem] font-bold text-slate-700 mb-1.5">Conversation ID</p>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[0.75rem] font-mono break-all inline-block w-full">
                {conversationId}
              </span>
            </div>

            <div>
              <p className="text-[0.85rem] font-bold text-slate-700 mb-1.5">Status</p>
              <p className="text-[0.95rem] font-medium text-slate-900 capitalize">{status}</p>
            </div>

            <div>
              <p className="text-[0.85rem] font-bold text-slate-700 mb-1.5">Agent Name</p>
              <p className="text-[0.95rem] font-medium text-slate-900">{agentName}</p>
            </div>

            <div>
              <p className="text-[0.85rem] font-bold text-slate-700 mb-1.5">Call Duration</p>
              <p className="text-[0.95rem] font-medium text-slate-900">{formatDuration(duration)}</p>
            </div>

            <div className="pb-6 border-b border-slate-100">
              <p className="text-[0.85rem] font-bold text-slate-700 mb-1.5">Start Time</p>
              <p className="text-[0.95rem] font-medium text-slate-900">{formatDate(startTime)}</p>
            </div>

            {/* Data Collection Section */}
            <div className="pb-6 border-b border-slate-100">
              <p className="text-[0.85rem] font-bold text-slate-700 mb-2">Data Collection (call_outcome)</p>
              {(() => {
                const outcomeObj = conversation.analysis?.data_collection_results?.call_outcome;
                const outcomeVal = typeof outcomeObj === 'string' ? outcomeObj : outcomeObj?.value;
                const rationale = outcomeObj?.rationale;

                if (!outcomeVal) {
                  return <span className="text-xs text-slate-400 italic">No outcome recorded</span>;
                }

                return (
                  <div className="space-y-1.5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-mono font-extrabold inline-block">
                      {outcomeVal}
                    </span>
                    {rationale && (
                      <p className="text-xs text-slate-500 italic leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                        "{rationale}"
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <p className="text-[0.85rem] font-bold text-slate-700 mb-3">Call Audio Recording</p>
              <audio 
                controls 
                className="w-full h-[40px] rounded-full" 
                src={`/api/conversations/${conversationId}/audio`}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>

        {/* Right Column: Transcript */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900">Full Call Transcript</h3>
            <span className="text-[0.85rem] font-bold text-slate-400">{transcript.length} Message Turns</span>
          </div>

          <div className="space-y-6">
            {transcript.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                No transcript available for this call.
              </div>
            ) : (
              transcript.map((msg: any, idx: number) => {
                const isAgent = msg.role === 'agent';
                const timeStr = formatTimeInCall(msg.time_in_call_secs || 0);

                return (
                  <div key={idx} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {isAgent ? (
                        <>
                          <Bot size={14} className="text-indigo-600" />
                          <span className="text-[0.75rem] font-bold text-slate-700">3knot AI Voice Agent</span>
                          <span className="text-[0.75rem] font-semibold text-slate-400">• {timeStr}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} className="text-slate-600" />
                          <span className="text-[0.75rem] font-bold text-slate-700">Lead / User</span>
                          <span className="text-[0.75rem] font-semibold text-slate-400">• {timeStr}</span>
                        </>
                      )}
                    </div>
                    
                    <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[0.95rem] leading-relaxed font-medium shadow-sm ${
                      isAgent 
                        ? 'bg-slate-100 text-slate-800 rounded-tl-sm' 
                        : 'bg-[#5c4fff] text-white rounded-tr-sm'
                    }`}>
                      {msg.message || msg.text || "..."}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
