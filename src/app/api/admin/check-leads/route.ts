import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LeadModel from "@/models/Lead";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const leads = await LeadModel.find({});
    return NextResponse.json({
      success: true,
      count: leads.length,
      leads: leads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
