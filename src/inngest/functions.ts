import { inngest } from "./client";
import connectDB from "../lib/mongodb";
import Lead from "../models/Lead";
import CallLog from "../models/CallLog";
import { triggerOutboundCall } from "../lib/elevenlabs";

export const initiateOutboundCall = inngest.createFunction(
  { id: "initiate-outbound-call", triggers: [{ event: "calls/initiate" }] },
  async ({ event, step }) => {
    const { leadId, agentId, agentPhoneNumberId } = event.data as { leadId: string; agentId?: string; agentPhoneNumberId?: string };

    await connectDB();
    
    let lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    if (["initiating", "in_progress", "ringing", "completed"].includes(lead.callStatus)) {
      return { message: "Call already initiated or completed." };
    }

    if (lead.callType === "auto" && lead.callDelayMinutes && lead.callDelayMinutes > 0) {
      await step.sleep("wait-for-delay", `${lead.callDelayMinutes}m`);
      
      // Re-fetch lead after sleep to ensure it hasn't been cancelled or called manually
      await connectDB();
      lead = await Lead.findById(leadId);
      if (!lead || ["initiating", "in_progress", "ringing", "completed"].includes(lead.callStatus)) {
        return { message: "Call status changed during delay. Aborting." };
      }
    }

    const result = await step.run("trigger-elevenlabs-call", async () => {
      await connectDB();
      const newLog = await CallLog.create({
        leadId: lead._id,
        callStatus: "initiating",
      });

      await Lead.updateOne({ _id: lead._id }, { callStatus: "initiating" });

      const dynamicVariables = {
        first_name: lead.firstName || "there",
        company: lead.company || "",
        context: lead.context || "",
        book_topic: lead.bookTopic || "",
        previous_summary: lead.lastCallSummary || lead.callSummary || "",
      };

      const response = await triggerOutboundCall(lead.phoneNumber, dynamicVariables, agentId, agentPhoneNumberId);

      if (response.success && response.conversation_id) {
        await CallLog.updateOne(
          { _id: newLog._id },
          {
            elevenlabsConversationId: response.conversation_id,
            callStatus: "in_progress",
          }
        );

        await Lead.updateOne(
          { _id: lead._id },
          {
            elevenlabsConversationId: response.conversation_id,
            callStatus: "in_progress",
            callErrorReason: null,
          }
        );
        return { success: true, conversation_id: response.conversation_id };
      } else {
        const errorMsg = response.error || "Unknown error occurred";
        await CallLog.updateOne(
          { _id: newLog._id },
          { callStatus: "failed", callErrorReason: errorMsg }
        );
        await Lead.updateOne(
          { _id: lead._id },
          { callStatus: "failed", callErrorReason: errorMsg }
        );
        return { success: false, error: errorMsg };
      }
    });

    return result;
  }
);
