"use server";

import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import CallLog from "@/models/CallLog";
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAgentId, getSelectedPhoneNumber } from "@/actions/agent.actions";
import { createBatchCallAction } from "@/actions/batch.actions";

export async function createLead(formData: FormData) {
  await connectDB();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const context = formData.get("context") as string;
  const bookTopic = formData.get("bookTopic") as string;
  const writingStage = formData.get("writingStage") as string;
  const callType = (formData.get("callType") as "manual" | "auto") || "manual";
  const callDelayMinutes = parseInt(formData.get("callDelayMinutes") as string) || 0;

  const lead = await Lead.create({
    firstName,
    lastName: lastName || "",
    phoneNumber,
    email: email || undefined,
    company: company || undefined,
    context: context || undefined,
    bookTopic: bookTopic || undefined,
    writingStage: writingStage || undefined,
    callType,
    callDelayMinutes,
    status: "new",
    callStatus: "pending",
  });

  if (callType === "auto") {
    const currentAgentId = await getCurrentAgentId();
    const agentPhoneNumberId = await getSelectedPhoneNumber();
    await inngest.send({
      name: "calls/initiate",
      data: {
        leadId: lead._id.toString(),
        agentId: currentAgentId,
        agentPhoneNumberId,
      },
    });
  }

  revalidatePath("/leads");
  redirect("/leads");
}

export async function importLeadsAction(payload: {
  leads: Array<{
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    bookTopic?: string;
    writingStage?: string;
    context?: string;
  }>;
  launchBatch?: boolean;
  batchName?: string;
  agentId?: string;
}) {
  try {
    if (!payload.leads || payload.leads.length === 0) {
      return { success: false, error: "No lead records provided to import." };
    }

    await connectDB();

    const createdOrUpdatedIds: string[] = [];
    const leadsForBatch = [];

    for (const item of payload.leads) {
      const cleanPhone = item.phoneNumber.trim();
      const fName = item.firstName?.trim() || "there";
      const lName = item.lastName?.trim() || "";

      let existingLead = await Lead.findOne({ phoneNumber: cleanPhone });

      if (existingLead) {
        if (item.email && !existingLead.email) existingLead.email = item.email;
        if (item.company && !existingLead.company) existingLead.company = item.company;
        if (item.bookTopic && !existingLead.bookTopic) existingLead.bookTopic = item.bookTopic;
        if (item.writingStage && !existingLead.writingStage) existingLead.writingStage = item.writingStage;
        if (item.context) {
          existingLead.context = existingLead.context 
            ? `${existingLead.context} | ${item.context}` 
            : item.context;
        }
        if (payload.launchBatch && payload.batchName) {
          existingLead.batchName = payload.batchName;
          existingLead.callStatus = "initiating";
        }
        await existingLead.save();
        createdOrUpdatedIds.push(existingLead._id.toString());
      } else {
        const newLead = await Lead.create({
          firstName: fName,
          lastName: lName,
          phoneNumber: cleanPhone,
          email: item.email?.trim(),
          company: item.company?.trim(),
          bookTopic: item.bookTopic?.trim(),
          writingStage: item.writingStage?.trim(),
          context: item.context?.trim(),
          source: payload.launchBatch ? "batch_import" : "excel_import",
          batchName: payload.launchBatch ? payload.batchName : undefined,
          status: "new",
          callStatus: payload.launchBatch ? "initiating" : "pending",
          callType: payload.launchBatch ? "auto" : "manual",
        });
        createdOrUpdatedIds.push(newLead._id.toString());
      }

      leadsForBatch.push({
        phoneNumber: cleanPhone,
        firstName: fName,
        lastName: lName,
        email: item.email,
        company: item.company,
        bookTopic: item.bookTopic,
        writingStage: item.writingStage,
        context: item.context,
      });
    }

    let batchResult = null;
    if (payload.launchBatch) {
      const bName = payload.batchName || `Batch Campaign - ${new Date().toLocaleDateString()}`;
      batchResult = await createBatchCallAction({
        callName: bName,
        agentId: payload.agentId,
        recipients: leadsForBatch,
      });
    }

    revalidatePath("/leads");
    revalidatePath("/batches");

    return {
      success: true,
      importedCount: createdOrUpdatedIds.length,
      launchedBatch: payload.launchBatch || false,
      batchResult,
    };
  } catch (error: any) {
    console.error("Error importing leads:", error);
    return { success: false, error: error.message };
  }
}

export async function triggerManualCall(leadId: string) {
  try {
    await connectDB();
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (["initiating", "in_progress", "ringing"].includes(lead.callStatus)) {
      return { success: false, error: "Call is already active" };
    }

    const agentId = await getCurrentAgentId();
    const agentPhoneNumberId = await getSelectedPhoneNumber();

    await inngest.send({
      name: "calls/initiate",
      data: { leadId: lead._id.toString(), agentId, agentPhoneNumberId },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error triggering manual call:", error);
    return { success: false, error: error.message };
  }
}

export async function getDashboardStats() {
  await connectDB();
  const totalLeads = await Lead.countDocuments();
  const completedCalls = await Lead.countDocuments({ callStatus: { $in: ["completed", "failed"] } });
  const inProgressCalls = await Lead.countDocuments({ callStatus: { $in: ["initiating", "in_progress", "ringing"] } });
  const pendingCalls = await Lead.countDocuments({ callStatus: "pending" });
  
  const recentLeads = await Lead.find().sort({ createdAt: -1 }).limit(5).lean();

  return {
    stats: {
      totalLeads,
      completedCalls,
      inProgressCalls,
      pendingCalls,
    },
    recentLeads: JSON.parse(JSON.stringify(recentLeads)),
  };
}

export async function getLeads() {
  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(leads));
}

export async function getLeadById(id: string) {
  await connectDB();
  const lead = await Lead.findById(id).lean();
  return JSON.parse(JSON.stringify(lead));
}

export async function updateLeadFollowUpAction(leadId: string, data: {
  preferredCallbackTime?: string;
  followUpNotes?: string;
  followUpStatus?: string;
  context?: string;
}) {
  try {
    await connectDB();
    await Lead.updateOne({ _id: leadId }, { $set: data });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
