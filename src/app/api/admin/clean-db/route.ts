import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LeadModel from "@/models/Lead";
import CallLogModel from "@/models/CallLog";

export async function GET() {
  try {
    await connectDB();
    const deletedLeads = await LeadModel.deleteMany({});
    const deletedLogs = await CallLogModel.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Database cleaned successfully",
      deletedLeadsCount: deletedLeads.deletedCount,
      deletedLogsCount: deletedLogs.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
