"use server";

import { getAgentDetails, updateAgentDetails } from "@/lib/elevenlabs";
import { revalidatePath } from "next/cache";

export async function fetchAgentDetails() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) return null;
  return await getAgentDetails(agentId);
}

export async function saveAgentDetails(formData: FormData) {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in environment");

  const name = formData.get("name") as string;
  const prompt = formData.get("prompt") as string;
  const firstMessage = formData.get("first_message") as string;
  const llm = formData.get("llm") as string;
  const temperature = formData.get("temperature") as string;
  const voiceId = formData.get("voice_id") as string;
  const ttsModelId = formData.get("tts_model_id") as string;

  const payload: any = {};
  if (name) payload.name = name;

  const conversationConfig: any = { agent: { prompt: {} }, tts: {} };
  
  if (prompt) conversationConfig.agent.prompt.prompt = prompt;
  if (firstMessage) conversationConfig.agent.first_message = firstMessage;
  if (llm) conversationConfig.agent.prompt.llm = llm;
  if (temperature) conversationConfig.agent.prompt.temperature = parseFloat(temperature);
  
  if (voiceId) conversationConfig.tts.voice_id = voiceId;
  if (ttsModelId) conversationConfig.tts.model_id = ttsModelId;

  // Clean empty nested objects
  if (Object.keys(conversationConfig.tts).length === 0) delete conversationConfig.tts;
  if (Object.keys(conversationConfig.agent.prompt).length === 0) delete conversationConfig.agent.prompt;
  if (Object.keys(conversationConfig.agent).length === 0) delete conversationConfig.agent;

  if (Object.keys(conversationConfig).length > 0) {
    payload.conversation_config = conversationConfig;
  }

  const success = await updateAgentDetails(agentId, payload);
  if (success) {
    revalidatePath("/agent/settings");
  } else {
    throw new Error("Failed to update agent details");
  }
}
