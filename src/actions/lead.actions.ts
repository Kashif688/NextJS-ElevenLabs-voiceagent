"use server";

import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLead(formData: FormData) {
  await connectDB();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const context = formData.get("context") as string;
  const callType = (formData.get("callType") as "manual" | "auto") || "manual";
  const callDelayMinutes = parseInt(formData.get("callDelayMinutes") as string) || 0;

  const lead = await Lead.create({
    firstName,
    lastName,
    phoneNumber,
    email,
    company,
    context,
    callType,
    callDelayMinutes,
    status: "new",
    callStatus: "pending",
  });

  if (callType === "auto") {
    await inngest.send({
      name: "calls/initiate",
      data: {
        leadId: lead._id.toString(),
      },
    });
  }

  revalidatePath("/leads");
  redirect("/leads");
}

export async function triggerManualCall(leadId: string) {
  await connectDB();
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error("Lead not found");

  if (!["initiating", "in_progress", "ringing"].includes(lead.callStatus)) {
    await inngest.send({
      name: "calls/initiate",
      data: {
        leadId: lead._id.toString(),
      },
    });
  }
  
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/");
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
