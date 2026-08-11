"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  action: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export default function CleanDbClientButton({ action }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClean = async () => {
    if (!confirm("Are you sure you want to clean all leads and call logs from the database? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await action();
      if (res.success) {
        alert(res.message || "Database cleaned successfully!");
      } else {
        alert(res.error || "Failed to clean database.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClean}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold text-sm transition-all hover:-translate-y-px disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      Clean Database
    </button>
  );
}
