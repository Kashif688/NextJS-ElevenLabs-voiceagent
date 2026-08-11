import { getConversations, getConversationDetails } from "@/lib/elevenlabs";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Link from "next/link";
import { PlayCircle, MessageSquare } from "lucide-react";
import { getCurrentAgentId } from "@/actions/agent.actions";

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number | undefined) {
  if (!seconds || seconds === 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatRelativeDate(unixSecs: number | undefined) {
  if (!unixSecs) return "N/A";
  const nowSecs = Math.floor(Date.now() / 1000);
  const diffSecs = Math.max(0, nowSecs - unixSecs);
  
  if (diffSecs < 60) return "Just now";
  if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  const d = new Date(unixSecs * 1000);
  return d.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric"
  }) + ", " + d.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true
  });
}

function extractCallOutcome(conv: any, log: any) {
  if (log?.callOutcome) return log.callOutcome;
  
  const dataCollection = conv?.analysis?.data_collection_results;
  if (dataCollection) {
    const outcomeObj = dataCollection.call_outcome;
    if (typeof outcomeObj === 'string') return outcomeObj;
    if (outcomeObj?.value !== undefined && outcomeObj?.value !== null) return outcomeObj.value;
  }

  const evalCriteria = conv?.analysis?.evaluation_criteria_results;
  if (evalCriteria?.call_outcome) {
    const val = evalCriteria.call_outcome.result || evalCriteria.call_outcome.value;
    if (val !== undefined && val !== null) return val;
  }

  if (conv?.call_outcome !== undefined && conv?.call_outcome !== null) return conv.call_outcome;
  return null;
}

export default async function ConversationsPage() {
  const currentAgentId = await getCurrentAgentId() || "";
  const data = await getConversations(50, currentAgentId);
  const rawConversations = data?.conversations || [];

  // Fetch detailed analysis for conversations in parallel to retrieve data_collection_results and transcript_summary
  const conversations = await Promise.all(
    rawConversations.slice(0, 30).map(async (c: any) => {
      try {
        const details = await getConversationDetails(c.conversation_id);
        return details ? { ...c, ...details } : c;
      } catch (e) {
        return c;
      }
    })
  );

  await connectDB();
  const conversationIds = conversations.map((c: any) => c.conversation_id);
  
  const callLogs = await CallLog.find({ elevenlabsConversationId: { $in: conversationIds } })
    .populate('leadId')
    .lean();

  const callLogMap = new Map(
    callLogs.map((log: any) => [log.elevenlabsConversationId, log])
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8 mt-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[1.2rem] font-extrabold text-slate-900">Conversations</h3>
            <p className="text-slate-500 text-sm mt-0.5">Explore real-time transcripts and extracted data collection analytics</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-500 text-[0.75rem] font-bold uppercase tracking-[0.05em]">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tl-lg">Title</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Date</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Duration</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Status</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Tags</th>
                <th className="px-5 py-3.5 border-b border-slate-200">call_outcome</th>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-slate-700">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MessageSquare size={32} className="text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-700">No conversations recorded yet</p>
                      <p className="text-xs text-slate-400">Outbound calls placed by the AI agent will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                conversations.map((conv: any, index: number) => {
                  const log = callLogMap.get(conv.conversation_id) as any;
                  const lead = log?.leadId;
                  const isLast = index === conversations.length - 1;
                  
                  const title = conv.transcript_summary || conv.analysis?.transcript_summary || conv.summary || log?.callSummary || "Untitled conversation";
                  const status = (conv.status || 'done').toLowerCase();
                  const isSuccess = status === 'done' || status === 'completed' || status === 'successful';
                  const isError = status === 'failed' || status === 'error';
                  const outcome = extractCallOutcome(conv, log);

                  return (
                    <tr key={conv.conversation_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 max-w-[340px] ${isLast ? 'border-none' : ''}`}>
                        <div className="flex flex-col">
                          <Link href={`/conversations/${conv.conversation_id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                            {title}
                          </Link>
                          {lead ? (
                            <span className="text-xs text-slate-400 mt-1">
                              Lead: <span className="font-semibold text-slate-600">{lead.firstName} {lead.lastName}</span> ({lead.phoneNumber})
                            </span>
                          ) : (
                            <span className="text-[0.75rem] font-mono text-slate-400 mt-1">
                              ID: {conv.conversation_id.substring(0, 18)}...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 font-semibold text-slate-800 text-[0.875rem] ${isLast ? 'border-none' : ''}`}>
                        {formatRelativeDate(conv.start_time_unix_secs)}
                      </td>

                      {/* Duration Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 font-medium text-slate-700 text-[0.875rem] ${isLast ? 'border-none' : ''}`}>
                        {formatDuration(conv.call_duration_secs)}
                      </td>

                      {/* Status Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {isSuccess ? (
                          <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold">
                            Successful
                          </span>
                        ) : isError ? (
                          <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 border border-red-200/60 rounded-full text-xs font-semibold">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold capitalize">
                            {status}
                          </span>
                        )}
                      </td>

                      {/* Tags Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 text-slate-400 text-sm ${isLast ? 'border-none' : ''}`}>
                        —
                      </td>

                      {/* call_outcome Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {outcome === null || outcome === undefined ? (
                          <span className="text-slate-400 italic text-xs">null</span>
                        ) : outcome === "scheduled_with_senior" ? (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-mono font-semibold">
                            scheduled_with_senior
                          </span>
                        ) : outcome === "callback_requested" ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs font-mono font-semibold">
                            callback_requested
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-medium">
                            {String(outcome)}
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        <Link 
                          href={`/conversations/${conv.conversation_id}`} 
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[0.8rem] font-semibold transition-colors"
                        >
                          <PlayCircle size={15} />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
