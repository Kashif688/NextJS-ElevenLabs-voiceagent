"use client";

import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { triggerManualCall } from "@/actions/lead.actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function TriggerCallButton({ leadId, currentStatus }: { leadId: string, currentStatus: string }) {
  const [isTriggering, setIsTriggering] = useState(false);
  const router = useRouter();

  const handleTriggerCall = async () => {
    try {
      setIsTriggering(true);
      await triggerManualCall(leadId);
      toast.success("Call initiated! The ElevenLabs agent is dialing the lead now.");
      router.refresh();
    } catch (error) {
      console.error("Error triggering call", error);
      toast.error("Failed to initiate the call. Please try again.");
    } finally {
      setIsTriggering(false);
    }
  };

  const isCallActive = ["initiating", "in_progress", "ringing"].includes(currentStatus);

  if (isCallActive) {
    return (
      <button disabled className="w-full py-4 bg-amber-100 text-amber-700 rounded-xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
        <Loader2 size={18} className="animate-spin" />
        Call In Progress...
      </button>
    );
  }

  return (
    <button
      onClick={handleTriggerCall}
      disabled={isTriggering}
      className="w-full py-4 bg-[#5c4fff] hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isTriggering ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
      {isTriggering ? 'Initiating...' : 'Retry Outbound Voice Call'}
    </button>
  );
}
