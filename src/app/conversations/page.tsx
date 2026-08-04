import { getConversations } from "@/lib/elevenlabs";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

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
  }) + "\n" + d.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false 
  });
}

export default async function ConversationsPage() {
  const data = await getConversations(50);
  const conversations = data?.conversations || [];

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
        
        <div className="mb-6">
          <h3 className="text-[1.15rem] font-bold text-slate-900">ElevenLabs Call Conversations Directory</h3>
          <p className="text-slate-500 text-sm mt-0.5">Fetched directly from ElevenLabs Conversational AI API</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-500 text-[0.75rem] font-bold uppercase tracking-[0.05em]">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tl-lg">Conversation ID</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Matched Lead / Contact</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Topic / Summary Title</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Duration</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Status</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Date & Time</th>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-slate-700">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No conversations found.
                  </td>
                </tr>
              ) : (
                conversations.map((conv: any, index: number) => {
                  const log = callLogMap.get(conv.conversation_id) as any;
                  const lead = log?.leadId;
                  const status = (conv.status || 'unknown').toLowerCase();
                  const isLast = index === conversations.length - 1;
                  
                  return (
                    <tr key={conv.conversation_id} className="hover:bg-slate-50 transition-colors">
                      <td className={`px-5 py-5 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono">
                          {conv.conversation_id.substring(0, 32)}...
                        </span>
                      </td>
                      <td className={`px-5 py-5 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {lead ? (
                          <div className="flex flex-col">
                            <Link href={`/leads/${lead._id}`} className="font-bold text-indigo-600 hover:underline">
                              {lead.firstName} {lead.lastName}
                            </Link>
                            <span className="text-slate-500 text-[0.8rem] mt-0.5">{lead.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Unmatched Call</span>
                        )}
                      </td>
                      <td className={`px-5 py-5 font-medium border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {log?.callSummary || "Voice Call Session"}
                      </td>
                      <td className={`px-5 py-5 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {formatDuration(conv.call_duration_secs)}
                      </td>
                      <td className={`px-5 py-5 font-bold capitalize border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        {status}
                      </td>
                      <td className={`px-5 py-5 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        <div className="whitespace-pre-line text-slate-500 text-[0.85rem]">
                          {formatDate(conv.start_time_unix_secs)}
                        </div>
                      </td>
                      <td className={`px-5 py-5 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        <Link 
                          href={`/conversations/${conv.conversation_id}`} 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#5c4fff] hover:bg-indigo-600 text-white rounded-lg text-[0.8rem] font-bold shadow-[0_2px_4px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5"
                        >
                          <PlayCircle size={16} />
                          View Conversation
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
