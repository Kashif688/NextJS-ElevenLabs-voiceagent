"use client";

import { useTransition } from "react";
import { reanalyzeBatchAction } from "@/actions/batch.actions";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function ReanalyzeBatchButton({ batchId, totalCount }: { batchId: string; totalCount: number }) {
  const [isPending, startTransition] = useTransition();

  const handleReanalyze = () => {
    toast.loading(`Evaluating remaining calls with ElevenLabs LLM...`, { id: "reanalyze-toast" });
    startTransition(async () => {
      const res = await reanalyzeBatchAction(batchId, undefined, true);
      if (res.success) {
        toast.success(res.message || `Successfully analyzed ${res.processedCount} calls!`, { id: "reanalyze-toast" });
      } else {
        toast.error(`Re-analysis error: ${res.error}`, { id: "reanalyze-toast" });
      }
    });
  };

  return (
    <button
      onClick={handleReanalyze}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
    >
      <RefreshCw size={14} className={isPending ? "animate-spin text-indigo-600" : "text-indigo-600"} />
      {isPending ? "Re-Evaluating LLM..." : "Re-Analyze Batch (ElevenLabs LLM)"}
    </button>
  );
}
