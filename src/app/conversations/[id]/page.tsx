import { getConversationDetails, getAgentDetails } from "@/lib/elevenlabs";
import Link from "next/link";
import { ArrowLeft, User, Bot, Clock, BookOpen, Wrench, Mail, Phone, Calendar } from "lucide-react";
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

  const dataCollection = conversation.analysis?.data_collection_results || {};
  const extractVal = (obj: any) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj.trim();
    if (obj.value !== undefined && obj.value !== null) return String(obj.value).trim();
    return null;
  };

  const outcomeVal = extractVal(dataCollection.call_outcome);
  const outcomeRationale = dataCollection.call_outcome?.rationale;
  const preferredCallback = extractVal(dataCollection.preferred_callback_time);
  const followUpContext = extractVal(dataCollection.follow_up_context);
  const bookTopic = extractVal(dataCollection.book_topic_or_title) || extractVal(dataCollection.book_topic);
  const writingStage = extractVal(dataCollection.writing_stage);
  const servicesDiscussed = extractVal(dataCollection.services_discussed);
  const confirmedEmail = extractVal(dataCollection.confirmed_email);
  const confirmedPhone = extractVal(dataCollection.confirmed_phone);

  const hasFollowUpData = !!preferredCallback || !!followUpContext || !!bookTopic || !!writingStage;

  return (
    <div className="max-w-[1300px] mx-auto pt-4 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/conversations" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[0.85rem] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white">
          <ArrowLeft size={16} />
          Back to All Conversations
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Call Metadata & Extracted Follow-Up Context */}
        <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8 shrink-0 space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900 pb-4 border-b border-slate-100">Call Metadata</h3>
          
          <div className="space-y-5">
            <div>
              <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Conversation ID</p>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[0.72rem] font-mono break-all inline-block w-full">
                {conversationId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Status</p>
                <p className="text-[0.9rem] font-bold text-slate-900 capitalize">{status}</p>
              </div>
              <div>
                <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Duration</p>
                <p className="text-[0.9rem] font-bold text-slate-900">{formatDuration(duration)}</p>
              </div>
            </div>

            <div>
              <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Agent Name</p>
              <p className="text-[0.9rem] font-semibold text-slate-900">{agentName}</p>
            </div>

            <div className="pb-5 border-b border-slate-100">
              <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Start Time</p>
              <p className="text-[0.9rem] font-medium text-slate-700">{formatDate(startTime)}</p>
            </div>

            {/* Call Outcome */}
            <div className="pb-5 border-b border-slate-100">
              <p className="text-[0.8rem] font-bold text-slate-700 mb-2">Evaluated Outcome</p>
              {outcomeVal ? (
                <div className="space-y-1.5">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-mono font-extrabold inline-block">
                    {outcomeVal}
                  </span>
                  {outcomeRationale && (
                    <p className="text-xs text-slate-500 italic leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                      "{outcomeRationale}"
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No outcome evaluated</span>
              )}
            </div>

            {/* Extracted Follow-Up & Book Context Card */}
            {hasFollowUpData && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
                  <Clock size={15} className="text-amber-600" />
                  Follow-Up & Author Context
                </div>

                {preferredCallback && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-amber-900">📅 Preferred Callback:</span>
                    <span className="font-mono font-extrabold bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                      {preferredCallback}
                    </span>
                  </div>
                )}

                {bookTopic && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">📖 Book Idea:</span>
                    <p className="text-slate-600 font-medium mt-0.5">{bookTopic}</p>
                  </div>
                )}

                {writingStage && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">✍️ Writing Stage:</span>
                    <span className="ml-1.5 px-2 py-0.5 bg-white border border-amber-200 rounded font-semibold text-slate-800 capitalize">
                      {writingStage.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                {servicesDiscussed && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">🛠️ Services Discussed:</span>
                    <p className="text-slate-600 font-medium mt-0.5">{servicesDiscussed}</p>
                  </div>
                )}

                {followUpContext && (
                  <div className="pt-2 border-t border-amber-200/80 text-xs">
                    <span className="font-bold text-slate-800">📝 Next Call Briefing:</span>
                    <p className="text-slate-700 leading-relaxed font-medium mt-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      {followUpContext}
                    </p>
                  </div>
                )}

                {(confirmedEmail || confirmedPhone) && (
                  <div className="pt-2 border-t border-amber-200/80 text-xs space-y-1">
                    {confirmedEmail && (
                      <p className="flex items-center gap-1 text-slate-600">
                        <Mail size={12} className="text-amber-700" />
                        <span className="font-semibold">{confirmedEmail}</span>
                      </p>
                    )}
                    {confirmedPhone && (
                      <p className="flex items-center gap-1 text-slate-600">
                        <Phone size={12} className="text-amber-700" />
                        <span className="font-mono font-semibold">{confirmedPhone}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-[0.8rem] font-bold text-slate-700 mb-2">Call Audio Recording</p>
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
                          <span className="text-[0.75rem] font-bold text-slate-700">Emma (American Books Wizard)</span>
                          <span className="text-[0.75rem] font-semibold text-slate-400">• {timeStr}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} className="text-slate-600" />
                          <span className="text-[0.75rem] font-bold text-slate-700">Author / Lead</span>
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
