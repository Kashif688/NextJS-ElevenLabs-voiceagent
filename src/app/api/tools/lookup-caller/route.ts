import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ElevenLabs passes tool parameters in the body. 
    // We expect the agent to pass 'phone_number'.
    const { phone_number } = body;

    if (!phone_number) {
      return NextResponse.json({ 
        error: "Missing phone_number parameter." 
      }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Clean the phone number (remove spaces, etc. just in case)
    const cleanPhone = phone_number.trim();

    // Look up the lead in the database
    const lead = await Lead.findOne({ phoneNumber: cleanPhone });

    if (!lead) {
      // Return a structured response telling Emma this is a brand new caller
      return NextResponse.json({
        found: false,
        message: "No existing CRM record found for this phone number. Treat as a new inbound caller."
      });
    }

    // Map the database fields to the structured JSON that Emma expects
    const responseData = {
      found: true,
      author_name: lead.firstName || "Unknown",
      book_topic: lead.bookTopic || "Unknown",
      writing_stage: lead.writingStage || "Unknown",
      current_stage: lead.lastCompletedStage || "no_interaction",
      detailed_previous_summary: lead.callSummary || lead.lastCallSummary || "No previous summary available.",
      has_existing_project: !!lead.bookTopic || !!lead.writingStage,
      company: lead.company || "",
      context: lead.context || ""
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error in lookup-caller API:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
