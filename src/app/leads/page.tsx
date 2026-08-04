import { getLeads } from "@/actions/lead.actions";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-7 mt-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[1.15rem] font-bold text-slate-900">Leads Directory</h3>
          <Link href="/leads/create" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_2px_4px_rgba(79,70,229,0.2)] hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(79,70,229,0.3)]">
            <Plus size={18} />
            Add New Lead
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-500 text-[0.75rem] font-bold uppercase tracking-[0.05em]">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tl-lg">Lead Name</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Phone Number</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Email</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Company</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Call Type</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Call Status</th>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p>You don't have any leads yet.</p>
                      <Link href="/leads/create" className="text-indigo-600 hover:underline font-bold">
                        Create your first lead
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead: any, index: number) => (
                  <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-5 py-4 font-bold border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      {lead.phoneNumber}
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      {lead.email || '-'}
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      {lead.company || '-'}
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[0.75rem] font-bold capitalize">
                        {lead.status === 'manual' ? 'Manual' : 'Automatic'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      <span className={`px-3 py-1 rounded-full text-[0.75rem] font-bold capitalize ${
                        lead.callStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        lead.callStatus === 'failed' ? 'bg-red-50 text-red-600' :
                        lead.callStatus === 'in_progress' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.callStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-5 py-4 border-b border-slate-200 ${index === leads.length - 1 ? 'border-none' : ''}`}>
                      <Link href={`/leads/${lead._id}`} className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[0.8rem] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
