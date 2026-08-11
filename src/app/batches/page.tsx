import { fetchBatchCalls } from "@/actions/batch.actions";
import Link from "next/link";
import { Layers, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const batchData = await fetchBatchCalls();
  
  // ElevenLabs batch calling returns items in a property (e.g. batch_jobs or jobs or as an array)
  const batches = Array.isArray(batchData) 
    ? batchData 
    : (batchData?.batch_calls || batchData?.batch_jobs || batchData?.jobs || batchData?.data || []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Outbound Batch Calls</h1>
          <p className="text-slate-500 text-sm mt-1">
            View and manage batch outbound call jobs triggered via ElevenLabs ConvAI.
          </p>
        </div>
        <Link
          href="/batches/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:-translate-y-px"
        >
          <Plus size={18} />
          Create a batch call
        </Link>
      </div>

      {/* Batches Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-500 text-[0.75rem] font-bold uppercase tracking-[0.05em]">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tl-lg">Batch Name / ID</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Recipients</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Status</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Progress</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Created Date</th>
                <th className="px-5 py-3.5 border-b border-slate-200 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-slate-700">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                        <Layers size={24} />
                      </div>
                      <p className="font-semibold text-slate-700">No batch calls found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Batch call jobs created in your ElevenLabs workspace will automatically show up here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch: any, index: number) => {
                  const batchId = batch.id || batch.batch_id;
                  const name = batch.name || batch.title || `Batch ${batchId.substring(0, 8)}`;
                  
                  const recipientCount =
                    batch.total_calls_dispatched ??
                    batch.total_calls_scheduled ??
                    batch.total_calls_finished ??
                    batch.total_recipient_count ??
                    batch.total_recipients_count ??
                    batch.total_recipients ??
                    batch.recipients_count ??
                    0;

                  const status = batch.status || "completed";
                  
                  // Progress calculation
                  let progress = "100%";
                  if (batch.total_calls_dispatched > 0 && batch.total_calls_finished !== undefined) {
                    const pct = Math.min(100, Math.round((batch.total_calls_finished / batch.total_calls_dispatched) * 100));
                    progress = `${pct}%`;
                  } else if (batch.progress !== undefined) {
                    progress = `${Math.round(batch.progress * 100)}%`;
                  }
                  
                  const rawCreated =
                    batch.created_at_unix ||
                    batch.created_at_unix_secs ||
                    batch.created_at ||
                    batch.created_at_timestamp ||
                    batch.created_timestamp;

                  let createdAt = "N/A";
                  if (rawCreated) {
                    const ts = typeof rawCreated === 'number' && rawCreated < 10000000000 ? rawCreated * 1000 : rawCreated;
                    try {
                      const d = new Date(ts);
                      if (!isNaN(d.getTime())) {
                        createdAt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      }
                    } catch (e) {
                      createdAt = String(rawCreated);
                    }
                  }

                  return (
                    <tr key={batchId} className="hover:bg-slate-50 transition-colors">
                      <td className={`px-5 py-4 font-bold border-b border-slate-200 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold">{name}</span>
                          <span className="text-xs text-slate-400 font-mono mt-0.5">{batchId}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 border-b border-slate-200 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        <span className="text-slate-600 font-semibold">{recipientCount} recipient{recipientCount === 1 ? '' : 's'}</span>
                      </td>
                      <td className={`px-5 py-4 border-b border-slate-200 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold capitalize ${
                          status === 'completed' || status === 'finished' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                          status === 'in_progress' || status === 'running' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/50' :
                          'bg-amber-50 text-amber-600 border border-amber-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                          {status}
                        </span>
                      </td>
                      <td className={`px-5 py-4 border-b border-slate-200 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: progress }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{progress}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 border-b border-slate-200 text-xs text-slate-500 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        {createdAt}
                      </td>
                      <td className={`px-5 py-4 border-b border-slate-200 ${index === batches.length - 1 ? 'border-none' : ''}`}>
                        <Link
                          href={`/batches/${batchId}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[0.8rem] font-semibold transition-colors"
                        >
                          View Conversations
                          <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
