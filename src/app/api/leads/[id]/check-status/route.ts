import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import CallLog from "@/models/CallLog";
import { getConversationDetails } from "@/lib/elevenlabs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id: leadId } = await params;

  const lead = await Lead.findById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (["completed", "failed"].includes(lead.callStatus)) {
    return NextResponse.json({ call_status: lead.callStatus, updated: false });
  }

  let convId = lead.elevenlabsConversationId;

  if (!convId) {
    const callLog = await CallLog.findOne({ leadId, elevenlabsConversationId: { $ne: null } }).sort({ createdAt: -1 });
    if (callLog) {
      convId = callLog.elevenlabsConversationId;
      await Lead.updateOne({ _id: leadId }, { elevenlabsConversationId: convId });
    }
  }

  if (!convId) {
    return NextResponse.json({
      call_status: lead.callStatus,
      call_error_reason: lead.callErrorReason,
      updated: false,
    });
  }

  const details = await getConversationDetails(convId);

  if (!details) {
    const errorReason = "Conversation record not found on ElevenLabs.";
    await Lead.updateOne({ _id: leadId }, { callStatus: "failed", callErrorReason: errorReason });
    await CallLog.updateMany({ elevenlabsConversationId: convId }, { callStatus: "failed", callErrorReason: errorReason });
    
    return NextResponse.json({
      call_status: "failed",
      updated: true,
      summary: errorReason,
    });
  }

  const status = (details.status || "").toLowerCase();
  const startTime = details.metadata?.start_time_unix_secs || null;
  const elapsedSeconds = startTime ? (Date.now() / 1000 - startTime) : 0;

  const isDone = ["done", "completed", "ended", "finished"].includes(status);
  const isFailed = ["failed", "canceled", "no_answer", "busy", "error"].includes(status);
  const isTimedOut = ["initiated", "in_progress"].includes(status) && elapsedSeconds > 45;

  if (isDone || isFailed || isTimedOut) {
    const finalStatus = isFailed || (isTimedOut && !details.transcript?.length) ? "failed" : "completed";

    let summaryText = details.analysis?.transcript_summary || details.analysis?.summary || details.call_summary_title || null;

    if (summaryText) {
      summaryText = typeof summaryText === "object" ? JSON.stringify(summaryText, null, 2) : summaryText;
    } else {
      const transcriptMessages = (details.transcript || []).map((turn: any) => {
        const role = (turn.role || "speaker") === "agent" ? "AI Agent" : "Lead";
        const msg = (turn.message || "").replace(/^"|"$/g, "").trim();
        return `${role}: ${msg}`;
      });

      summaryText = transcriptMessages.length > 0 
        ? transcriptMessages.join("\n") 
        : (finalStatus === "failed" ? "Call declined, unanswered, or ended by recipient." : "Call finished.");
    }

    const errorReason = finalStatus === "failed" ? (details.error || "Call declined or unanswered by lead.") : null;

    await Lead.updateOne(
      { _id: leadId },
      {
        callStatus: finalStatus,
        callSummary: summaryText,
        callErrorReason: errorReason,
      }
    );

    await CallLog.updateMany(
      { elevenlabsConversationId: convId },
      {
        callStatus: finalStatus,
        callSummary: summaryText,
        callErrorReason: errorReason,
        rawWebhookPayload: details,
      }
    );

    return NextResponse.json({
      call_status: finalStatus,
      updated: true,
      summary: summaryText,
    });
  }

  return NextResponse.json({
    call_status: lead.callStatus,
    updated: false,
  });
}
