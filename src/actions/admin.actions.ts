"use server";

import connectDB from "@/lib/mongodb";
import LeadModel from "@/models/Lead";
import CallLogModel from "@/models/CallLog";
import { revalidatePath } from "next/cache";

export async function clearDatabaseAction() {
  try {
    await connectDB();
    const deletedLeads = await LeadModel.deleteMany({});
    const deletedLogs = await CallLogModel.deleteMany({});

    revalidatePath("/leads");
    revalidatePath("/conversations");
    revalidatePath("/");

    return {
      success: true,
      message: `Database cleaned: ${deletedLeads.deletedCount} leads and ${deletedLogs.deletedCount} call logs deleted.`,
    };
  } catch (error: any) {
    console.error("Error cleaning database:", error);
    return {
      success: false,
      error: error.message || "Failed to clear database",
    };
  }
}
