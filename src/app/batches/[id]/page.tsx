import { fetchBatchCallDetails } from "@/actions/batch.actions";
import { getConversationDetails } from "@/lib/elevenlabs";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Link from "next/link";
import BatchAnalyticsSection from "@/components/BatchAnalyticsSection";
import ReanalyzeBatchButton from "@/components/ReanalyzeBatchButton";
import { OutcomeItem } from "@/components/OutcomeCircleChart";
import { Target, TrendingUp, Clock, PhoneCall, CheckCircle2, MessageSquare, User, ArrowLeft, Layers } from "lucide-react";

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

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled_with_senior: { label: "scheduled_with_senior", color: "#6366f1" }, // Indigo
  callback_requested: { label: "callback_requested", color: "#10b981" }, // Emerald
  spoke_but_declined: { label: "spoke_but_declined", color: "#a855f7" }, // Purple
  voicemail: { label: "voicemail", color: "#ec4899" }, // Pink (ElevenLabs Style)
  no_answer: { label: "no_answer", color: "#3b82f6" }, // Blue
  wrong_number: { label: "wrong_number", color: "#f43f5e" }, // Rose
  busy: { label: "busy", color: "#f59e0b" }, // Amber
  hung_up: { label: "hung_up", color: "#ef4444" }, // Crimson
  no_info_provided: { label: "no_info_provided", color: "#64748b" }, // Slate
  call_ended_quickly: { label: "call_ended_quickly", color: "#f97316" }, // Orange
  other: { label: "other", color: "#06b6d4" }, // Cyan
  null: { label: "unprocessed / null", color: "#cbd5e1" },
};

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
    rawRecipients.map(async (item: any) => {
      const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
      const rawStatus = item.status || item.call_status || item.recipient_status || item.state;
      if (convId) {
        try {
          const details = await getConversationDetails(convId);
          if (details) {
            return { ...item, ...details, recipientStatus: rawStatus || details.status };
          }
        } catch (e) {
          // Ignore fetch error
        }
      }
      return { ...item, recipientStatus: rawStatus };
    })
  );

  await connectDB();
  const convIds = recipients.map((r: any) => r.conversation_id || r.id || r.elevenlabs_conversation_id).filter(Boolean);
  const callLogs = await CallLog.find({ elevenlabsConversationId: { $in: convIds } }).populate('leadId').lean();
  const callLogMap = new Map(callLogs.map((l: any) => [l.elevenlabsConversationId, l]));

  // Calculate 2-Level Batch Analytics (Level 1: Delivery Status, Level 2: LLM Conversation Outcomes)
  const statusCounts: Record<string, number> = {};
  const outcomesCount: Record<string, number> = {};
  let totalDurationSecs = 0;
  let answeredCalls = 0;
  let convertedCalls = 0;

  recipients.forEach((item: any) => {
    const convId = item.conversation_id || item.id || item.elevenlabs_conversation_id;
    const log = convId ? callLogMap.get(convId) : null;
    
    // Level 1: Raw Delivery Status from Batch Recipient Engine
    const statusRaw = String(item.recipientStatus || item.call_status || item.status || log?.callStatus || "completed").toLowerCase();
    let deliveryKey = "completed";
    if (statusRaw.includes("voicemail")) deliveryKey = "voicemail";
    else if (statusRaw.includes("no_answer") || statusRaw.includes("no answer")) deliveryKey = "no_answer";
    else if (statusRaw.includes("busy")) deliveryKey = "busy";
    else if (statusRaw.includes("failed") || statusRaw.includes("error")) deliveryKey = "failed";

    statusCounts[deliveryKey] = (statusCounts[deliveryKey] || 0) + 1;

    // Level 2: Conversation Outcome
    const outcome = extractCallOutcome(item, log) || "no_info_provided";
    
    if (deliveryKey === "completed") {
      outcomesCount[outcome] = (outcomesCount[outcome] || 0) + 1;
    }

    const duration = item.metadata?.call_duration_secs ?? item.call_duration_secs ?? item.duration_secs ?? item.duration ?? 0;
    totalDurationSecs += duration;

    if (deliveryKey === "completed") {
      answeredCalls++;
    }

    if (["scheduled_with_senior", "callback_requested"].includes(outcome)) {
      convertedCalls++;
    }
  });

  const totalCalls = recipients.length || 1;
  const avgDurationSecs = Math.round(totalDurationSecs / totalCalls);
  const conversionRate = Math.round((convertedCalls / totalCalls) * 100);
  const answerRate = Math.round((answeredCalls / totalCalls) * 100);

  const DELIVERY_CONFIG: Record<string, { label: string; color: string }> = {
    completed: { label: "Completed (Answered)", color: "#10b981" },
    voicemail: { label: "Voicemail Reached", color: "#ec4899" },
    no_answer: { label: "No Answer", color: "#3b82f6" },
    busy: { label: "Busy Line", color: "#f59e0b" },
    failed: { label: "Failed / Error", color: "#ef4444" },
  };

  const deliveryStatusData: OutcomeItem[] = Object.entries(statusCounts).map(([key, count]) => {
    const config = DELIVERY_CONFIG[key] || { label: key, color: "#64748b" };
    return {
      key,
      label: config.label,
      count,
      color: config.color,
      percentage: (count / totalCalls) * 100,
    };
  });

  const llmOutcomeData: OutcomeItem[] = Object.entries(outcomesCount).map(([key, count]) => {
    const config = OUTCOME_CONFIG[key] || { label: key, color: "#64748b" };
    return {
      key,
      label: config.label,
      count,
      color: config.color,
      percentage: answeredCalls > 0 ? (count / answeredCalls) * 100 : 0,
    };
  });

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

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
          <div>
            <span className="text-xs uppercase text-slate-400 font-bold block">Total Recipients</span>
            <span className="font-extrabold text-slate-900 text-base">{rawRecipients.length}</span>
          </div>
          <div>
            <span className="text-xs uppercase text-slate-400 font-bold block">Created Date</span>
            <span className="font-semibold text-slate-800">{createdAt}</span>
          </div>
          <ReanalyzeBatchButton batchId={id} totalCount={rawRecipients.length} />
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Calls</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{rawRecipients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PhoneCall size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Answer Rate</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{answerRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{conversionRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Avg Call Duration</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatDuration(avgDurationSecs)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Interactive Analytics & Filtered Table */}
      <BatchAnalyticsSection
        statusData={deliveryStatusData}
        outcomeData={llmOutcomeData}
        recipients={recipients}
        callLogs={JSON.parse(JSON.stringify(callLogs))}
      />
    </div>
  );
}
