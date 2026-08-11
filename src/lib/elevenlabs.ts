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

export async function triggerOutboundCall(
  phoneNumber: string, 
  dynamicVariables: Record<string, string> = {}, 
  agentId?: string,
  agentPhoneNumberId?: string
) {
  try {
    const response = await client.post(`/v1/convai/twilio/outbound-call`, {
      agent_id: agentId || AGENT_ID,
      agent_phone_number_id: agentPhoneNumberId || process.env.AGENT_PHONE_NUMBER_ID,
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

export async function getAgents() {
  try {
    const response = await client.get(`/v1/convai/agents`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching agents:', error.response?.data || error.message);
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

export async function getBatchCalls(agentId?: string) {
  try {
    const targetAgentId = agentId || AGENT_ID;
    const url = targetAgentId 
      ? `/v1/convai/batch-calling/workspace?agent_id=${targetAgentId}`
      : '/v1/convai/batch-calling/workspace';
    
    const response = await client.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching batch calls:', error.response?.data || error.message);
    return null;
  }
}

export async function getBatchCallDetails(batchId: string) {
  try {
    const response = await client.get(`/v1/convai/batch-calling/${batchId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching batch call details:', error.response?.data || error.message);
    return null;
  }
}

export async function submitBatchCall(payload: {
  call_name: string;
  agent_id?: string;
  agent_phone_number_id?: string;
  recipients: Array<{
    phone_number: string;
    conversation_initiation_client_data?: {
      dynamic_variables?: Record<string, string>;
    };
  }>;
}) {
  try {
    const response = await client.post('/v1/convai/batch-calling/submit', {
      agent_id: payload.agent_id || AGENT_ID,
      agent_phone_number_id: payload.agent_phone_number_id || process.env.AGENT_PHONE_NUMBER_ID,
      call_name: payload.call_name,
      recipients: payload.recipients,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error submitting batch call:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data || error.message,
    };
  }
}

export async function getPhoneNumbers() {
  try {
    const response = await client.get('/v1/convai/phone-numbers');
    return response.data?.phone_numbers || response.data || [];
  } catch (error: any) {
    console.error('Error fetching phone numbers:', error.response?.data || error.message);
    return [];
  }
}

export async function runConversationAnalysis(conversationId: string) {
  try {
    const response = await client.post(`/v1/convai/conversations/${conversationId}/analysis/run`);
    return response.data;
  } catch (error: any) {
    console.error(`Error running analysis for ${conversationId}:`, error.response?.data || error.message);
    return null;
  }
}
