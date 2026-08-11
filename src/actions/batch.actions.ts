"use server";

import { getBatchCalls, getBatchCallDetails, submitBatchCall } from "@/lib/elevenlabs";
import { getCurrentAgentId } from "@/actions/agent.actions";
import { revalidatePath } from "next/cache";

export async function fetchBatchCalls() {
  return await getBatchCalls();
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

  const formattedRecipients = payload.recipients.map((r) => ({
    phone_number: r.phoneNumber.trim(),
    conversation_initiation_client_data: r.firstName ? {
      dynamic_variables: {
        first_name: r.firstName.trim(),
      },
    } : undefined,
  }));

  const res = await submitBatchCall({
    call_name: payload.callName,
    agent_id: activeAgentId,
    recipients: formattedRecipients,
  });

  if (res.success) {
    revalidatePath("/batches");
    revalidatePath("/");
  }

  return res;
}
