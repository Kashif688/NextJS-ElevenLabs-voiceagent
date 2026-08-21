"use server";

import { getBatchCalls, getBatchCallDetails, submitBatchCall, runConversationAnalysis, getConversationDetails } from "@/lib/elevenlabs";
import { getCurrentAgentId, getSelectedPhoneNumber } from "@/actions/agent.actions";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import { revalidatePath } from "next/cache";

export async function fetchBatchCalls() {
  const currentAgentId = await getCurrentAgentId();
  return await getBatchCalls(currentAgentId);
}

export async function fetchBatchCallDetails(batchId: string) {
  return await getBatchCallDetails(batchId);
}

export async function createBatchCallAction(payload: {
  callName: string;
  agentId?: string;
  recipients: Array<{
    phoneNumber: string;
    firstName?: string;
  }>;
}) {
  if (!payload.callName) {
    return { success: false, error: "Batch campaign name is required" };
  }

  if (!payload.recipients || payload.recipients.length === 0) {
    return { success: false, error: "At least one recipient phone number is required" };
  }

  const activeAgentId = payload.agentId || await getCurrentAgentId();
  const activePhoneNumberId = await getSelectedPhoneNumber();

  const formattedRecipients = payload.recipients.map((r) => ({
    phone_number: r.phoneNumber.trim(),
    conversation_initiation_client_data: {
      dynamic_variables: {
        first_name: r.firstName?.trim() || "there",
      },
    },
  }));

  const res = await submitBatchCall({
    call_name: payload.callName,
    agent_id: activeAgentId,
    agent_phone_number_id: activePhoneNumberId,
    recipients: formattedRecipients,
  });

  if (res.success) {
    revalidatePath("/batches");
    revalidatePath("/");
  }

  return res;
}

export async function reanalyzeBatchAction(batchId: string, limit?: number, skipProcessed: boolean = false) {
  try {
    const details = await getBatchCallDetails(batchId);
    if (!details) return { success: false, error: "Batch details not found" };

    const rawRecipients = details.recipients || details.recipient_calls || details.calls || details.conversations || details.items || [];
    let conversationIds = rawRecipients
      .map((r: any) => r.conversation_id || r.id || r.elevenlabs_conversation_id)
      .filter(Boolean);

    await connectDB();

    if (skipProcessed) {
      const existingLogs = await CallLog.find({
        elevenlabsConversationId: { $in: conversationIds },
        callOutcome: { $nin: [null, ""] }
      }).select("elevenlabsConversationId").lean();

      const processedSet = new Set(existingLogs.map((l: any) => l.elevenlabsConversationId));
      conversationIds = conversationIds.filter((id: string) => !processedSet.has(id));
    }

    if (limit && limit > 0) {
      conversationIds = conversationIds.slice(0, limit);
    }

    if (conversationIds.length === 0) {
      return { success: true, processedCount: 0, totalCount: 0, message: "All calls in this batch are already evaluated!" };
    }
    let processedCount = 0;

    // Process conversations in chunks of 25 to avoid API rate limits while keeping HTTP execution fast
    const chunkSize = 25;
    for (let i = 0; i < conversationIds.length; i += chunkSize) {
      const chunk = conversationIds.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (convId: string) => {
          try {
            // 1. Run LLM re-analysis on ElevenLabs
            await runConversationAnalysis(convId);
            
            // 2. Fetch updated details
            const convDetails = await getConversationDetails(convId);
            if (!convDetails) return;

            const dataCollection = convDetails.analysis?.data_collection_results;
            let outcome = null;
            if (dataCollection?.call_outcome) {
              const outcomeObj = dataCollection.call_outcome;
              outcome = typeof outcomeObj === 'string' ? outcomeObj : (outcomeObj.value ?? null);
            }

            const summary = convDetails.analysis?.transcript_summary || convDetails.transcript_summary || null;
            const durationSecs = convDetails.metadata?.call_duration_secs || 0;
            const status = convDetails.status || "completed";

            // Fallback outcome if LLM data_collection was empty/null (e.g. voicemail, no answer, short call)
            if (!outcome) {
              const statusLower = String(status).toLowerCase();
              const transcript = convDetails.transcript || [];
              if (statusLower.includes("voicemail")) {
                outcome = "voicemail";
              } else if (statusLower.includes("no_answer") || statusLower.includes("no answer")) {
                outcome = "no_answer";
              } else if (statusLower.includes("busy")) {
                outcome = "busy_hangup";
              } else if (statusLower.includes("failed") || statusLower.includes("error")) {
                outcome = "failed";
              } else if (Array.isArray(transcript) && transcript.length === 0 && durationSecs > 0) {
                outcome = "speak_no_word";
              } else {
                outcome = "not_evaluated";
              }
            }

            // 3. Upsert into CallLog
            await CallLog.updateOne(
              { elevenlabsConversationId: convId },
              {
                $set: {
                  elevenlabsConversationId: convId,
                  callOutcome: outcome,
                  callSummary: summary,
                  callDurationSecs: durationSecs,
                  callStatus: status,
                  callAnalysis: convDetails.analysis || null,
                },
              },
              { upsert: true }
            );

            processedCount++;
          } catch (err: any) {
            console.error(`Error processing conversation ${convId}:`, err);
          }
        })
      );
    }

    revalidatePath(`/batches/${batchId}`);
    revalidatePath("/batches");
    revalidatePath("/conversations");

    return {
      success: true,
      processedCount,
      totalCount: conversationIds.length,
    };
  } catch (error: any) {
    console.error("Error reanalyzing batch:", error);
    return { success: false, error: error.message };
  }
}
