import { fetchBatchCallDetails } from "@/actions/batch.actions";
import { getConversationDetails } from "@/lib/elevenlabs";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Link from "next/link";
import { ArrowLeft, PhoneCall, CheckCircle2, MessageSquare, User, Clock, Layers } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

  if (item?.call_outcome !== undefined && item?.call_outcome !== null) return item.call_outcome;
  return null;
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchDetails = await fetchBatchCallDetails(id);

  if (!batchDetails) {
    return (
      <div className="space-y-6">
        <Link href="/batches" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} />
          Back to Batches
        </Link>
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <Layers size={36} className="mx-auto text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Batch Details Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Unable to fetch batch details for ID: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">{id}</code>. Please verify your ElevenLabs API credentials.
          </p>
        </div>
      </div>
    );
  }

  const batchName = batchDetails.name || batchDetails.title || `Batch ${id.substring(0, 8)}`;
  const status = batchDetails.status || "completed";
  const rawRecipients = batchDetails.recipients || batchDetails.recipient_calls || batchDetails.calls || batchDetails.conversations || batchDetails.items || [];
  
  // Enrich recipients with detailed conversation metadata (duration, transcript summary, call_outcome)
  const recipients = await Promise.all(
    rawRecipients.slice(0, 30).map(async (item: any) => {
      const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
      if (convId) {
        try {
          const details = await getConversationDetails(convId);
          if (details) {
            return { ...item, ...details };
          }
        } catch (e) {
          // Ignore fetch error
        }
      }
      return item;
    })
  );

  await connectDB();
  const convIds = recipients.map((r: any) => r.conversation_id || r.id || r.elevenlabs_conversation_id).filter(Boolean);
  const callLogs = await CallLog.find({ elevenlabsConversationId: { $in: convIds } }).populate('leadId').lean();
  const callLogMap = new Map(callLogs.map((l: any) => [l.elevenlabsConversationId, l]));

  const rawCreated =
    batchDetails.created_at_unix ||
    batchDetails.created_at_unix_secs ||
    batchDetails.created_at ||
    batchDetails.created_at_timestamp ||
    batchDetails.created_timestamp ||
    batchDetails.creation_timestamp ||
    batchDetails.created_time ||
    batchDetails.date;

  let createdAt = "N/A";
  if (rawCreated) {
    const ts = typeof rawCreated === 'number' && rawCreated < 10000000000 ? rawCreated * 1000 : rawCreated;
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        createdAt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      createdAt = String(rawCreated);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/batches" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} />
        Back to All Batches
      </Link>

      {/* Batch Summary Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{batchName}</h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-xs font-bold capitalize">
              {status}
            </span>
          </div>
          <p className="text-slate-500 text-xs font-mono mt-1">Batch ID: {id}</p>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-600 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
          <div>
            <span className="text-xs uppercase text-slate-400 font-bold block">Total Recipients</span>
            <span className="font-extrabold text-slate-900 text-base">{rawRecipients.length}</span>
          </div>
          <div>
            <span className="text-xs uppercase text-slate-400 font-bold block">Created Date</span>
            <span className="font-semibold text-slate-800">{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Conversations inside this Batch */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            Conversations in this Batch
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{rawRecipients.length} calls recorded</span>
        </div>

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
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No individual conversations recorded for this batch job yet.
                  </td>
                </tr>
              ) : (
                recipients.map((item: any, index: number) => {
                  const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
                  const log = convId ? callLogMap.get(convId) : null;
                  const phoneNumber = item.phone_number || item.to_number || item.recipient_phone_number || log?.leadId?.phoneNumber || "N/A";
                  const name = item.name || item.recipient_name || (log?.leadId ? `${log.leadId.firstName} ${log.leadId.lastName}` : "Recipient");
                  const callStatus = item.call_status || item.status || "completed";
                  const isLast = index === recipients.length - 1;

                  const summary = item.analysis?.transcript_summary || item.transcript_summary || item.summary || log?.callSummary;
                  const outcome = extractCallOutcome(item, log);
                  const durationSecs =
                    item.metadata?.call_duration_secs ??
                    item.call_duration_secs ??
                    item.duration_secs ??
                    item.duration ??
                    0;

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

                      {/* Call Status */}
                      <td className={`px-5 py-4 border-b border-slate-200 ${isLast ? 'border-none' : ''}`}>
                        <span className={`px-2.5 py-1 rounded-full text-[0.75rem] font-bold capitalize ${
                          callStatus === 'completed' || callStatus === 'success' || callStatus === 'done' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                          callStatus === 'failed' || callStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-200/50' :
                          'bg-indigo-50 text-indigo-600 border border-indigo-200/50'
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
    </div>
  );
}
