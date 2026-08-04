import axios from 'axios';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

const client = axios.create({
  baseURL: 'https://api.elevenlabs.io',
  headers: {
    'xi-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export async function triggerOutboundCall(phoneNumber: string, dynamicVariables: Record<string, string> = {}, agentId?: string) {
  try {
    const response = await client.post(`/v1/convai/twilio/outbound-call`, {
      agent_id: agentId || AGENT_ID,
      agent_phone_number_id: process.env.AGENT_PHONE_NUMBER_ID,
      to_number: phoneNumber,
      dynamic_variables: dynamicVariables,
    });
    
    return {
      success: true,
      conversation_id: response.data.conversation_id || response.data.id || null, // sometimes it's returned as id
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error triggering ElevenLabs call:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
    };
  }
}

export async function getConversationDetails(conversationId: string) {
  try {
    const response = await client.get(`/v1/convai/conversations/${conversationId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversation details:', error.response?.data || error.message);
    return null;
  }
}

export async function getAgentDetails(agentId: string) {
  try {
    const response = await client.get(`/v1/convai/agents/${agentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching agent details:', error.response?.data || error.message);
    return null;
  }
}

export async function updateAgentDetails(agentId: string, payload: any) {
  try {
    // We typically use PATCH for updating agent config, depending on ElevenLabs API specs.
    // The previous laravel code seemed to just pass payload.
    const response = await client.patch(`/v1/convai/agents/${agentId}`, payload);
    return true;
  } catch (error: any) {
    console.error('Error updating agent details:', error.response?.data || error.message);
    return false;
  }
}

export async function getConversations(limit: number = 50, agentId?: string) {
  try {
    const response = await client.get(`/v1/convai/conversations?agent_id=${agentId || AGENT_ID}&page_size=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversations:', error.response?.data || error.message);
    return null;
  }
}
