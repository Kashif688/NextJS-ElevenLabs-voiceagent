import { getLeadById } from "@/actions/lead.actions";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LeadStatus from "./LeadStatus";
import TriggerCallButton from "./TriggerCallButton";

export const dynamic = 'force-dynamic';

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const lead = await getLeadById(resolvedParams.id);

  if (!lead) {
    return (
      <div className="p-8 text-center text-slate-500">
        Lead not found. <Link href="/leads" className="text-blue-600 hover:underline">Go back</Link>
      </div>
    );
  }

  await connectDB();
  const logs = await CallLog.find({ leadId: lead._id }).sort({ createdAt: -1 }).lean();
  
  // Transform ObjectId to string to pass to client component securely
  const serializedLogs = logs.map((l: any) => ({
    ...l,
    _id: l._id.toString(),
    leadId: l.leadId.toString(),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const serializedLead = {
    ...lead,
    _id: lead._id.toString(),
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 items-start">
        
        {/* Left Column: Lead Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col min-h-0 relative">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {lead.firstName} {lead.lastName}
              </h1>
              <p className="text-[0.85rem] text-slate-500 font-medium mt-1">
                Created on {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-[0.75rem] font-bold capitalize ${
              lead.callStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' :
              lead.callStatus === 'failed' ? 'bg-red-50 text-red-600' :
              ['initiating', 'in_progress', 'ringing'].includes(lead.callStatus) ? 'bg-amber-50 text-amber-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {lead.callStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Phone Number</p>
              <p className="text-[1.05rem] font-extrabold text-slate-900">{lead.phoneNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Email</p>
                <p className="text-[0.95rem] font-medium text-slate-700">{lead.email || '-'}</p>
              </div>
              <div>
                <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Company</p>
                <p className="text-[0.95rem] font-medium text-slate-700">{lead.company || '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-[0.8rem] font-bold text-slate-500 mb-1">Dispatch Strategy</p>
              <p className="text-[0.95rem] font-medium text-slate-700 capitalize">{lead.callType} Call</p>
            </div>

            <div>
              <p className="text-[0.8rem] font-bold text-slate-500 mb-2">Agent Context</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[0.9rem] text-slate-700 font-medium">
                {lead.context || "No additional context provided for this lead."}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6">
             <TriggerCallButton leadId={lead._id.toString()} currentStatus={lead.callStatus} />
          </div>
        </div>

        {/* Right Column: Voice Call Analytics */}
        <LeadStatus lead={serializedLead} logs={serializedLogs} />

      </div>
    </div>
  );
}
