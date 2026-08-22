"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteLeadAndHistory } from "@/actions/lead.actions";
import toast from "react-hot-toast";

export default function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead and its entire call history? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    toast.loading("Deleting lead...", { id: "delete-lead" });

    const result = await deleteLeadAndHistory(leadId);

    if (result.success) {
      toast.success("Lead deleted successfully", { id: "delete-lead" });
      if (window.location.pathname !== "/leads") {
        window.location.href = "/leads";
      }
    } else {
      toast.error(result.error || "Failed to delete lead", { id: "delete-lead" });
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
      title="Delete Lead"
    >
      <Trash2 size={16} />
    </button>
  );
}
