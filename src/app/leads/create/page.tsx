import { createLead } from "@/actions/lead.actions";
import Link from "next/link";

export default function CreateLeadPage() {
  return (
    <div className="max-w-[900px] mx-auto pt-6 pb-12">
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 p-8 md:p-10">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">New Lead Details</h2>
          <Link href="/leads" className="px-4 py-2 border border-slate-200 rounded-xl text-[0.85rem] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            Back to List
          </Link>
        </div>

        <form action={createLead} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label htmlFor="firstName" className="block text-[0.85rem] font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input type="text" id="firstName" name="firstName" placeholder="John" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>
            <div className="space-y-2.5">
              <label htmlFor="lastName" className="block text-[0.85rem] font-bold text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input type="text" id="lastName" name="lastName" placeholder="Doe" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label htmlFor="phoneNumber" className="block text-[0.85rem] font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+1234567890" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>
            <div className="space-y-2.5">
              <label htmlFor="email" className="block text-[0.85rem] font-bold text-slate-700">Email Address</label>
              <input type="email" id="email" name="email" placeholder="john@example.com" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label htmlFor="company" className="block text-[0.85rem] font-bold text-slate-700">Company Name</label>
            <input type="text" id="company" name="company" placeholder="Acme Corp" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium" />
          </div>

          <div className="space-y-2.5">
            <label htmlFor="context" className="block text-[0.85rem] font-bold text-slate-700">Context for 3knot Digital Voice Agent</label>
            <textarea id="context" name="context" rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-[0.95rem] text-slate-900 placeholder:text-slate-400 font-medium leading-relaxed" placeholder="Add custom instructions or background info for the AI agent (e.g. Lead requested a demo on enterprise pricing)..."></textarea>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="text-[0.9rem] font-bold text-slate-800">Call Dispatch Strategy</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="relative flex cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50 has-[:checked]:ring-1 has-[:checked]:ring-indigo-600 hover:border-indigo-200">
                <input type="radio" name="callType" value="manual" className="peer sr-only" defaultChecked />
                <div className="flex gap-4">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white peer-checked:border-[6px] peer-checked:border-indigo-600"></div>
                  <div>
                    <span className="block text-[0.95rem] font-bold text-slate-900">Manual Call</span>
                    <span className="mt-1 block text-[0.85rem] text-slate-500 leading-relaxed font-medium">Trigger the call manually from the lead details page.</span>
                  </div>
                </div>
              </label>
              
              <label className="relative flex cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50 has-[:checked]:ring-1 has-[:checked]:ring-indigo-600 hover:border-indigo-200">
                <input type="radio" name="callType" value="auto" className="peer sr-only" />
                <div className="flex gap-4">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white peer-checked:border-[6px] peer-checked:border-indigo-600"></div>
                  <div>
                    <span className="block text-[0.95rem] font-bold text-slate-900">Automatic Call</span>
                    <span className="mt-1 block text-[0.85rem] text-slate-500 leading-relaxed font-medium">Schedule the AI agent to call automatically after creation.</span>
                  </div>
                </div>
              </label>
            </div>
            {/* Keeping the delay input hidden or simple, as the UI screenshot didn't prominently show it. We can leave it hidden for manual and show for auto, but for simplicity we'll just include a hidden input or simple input below if needed. The original had it. Let's add a small delay input if auto is selected. Actually, the user's screenshot didn't show delay. I will just pass a hidden value 0 for it to satisfy backend action. */}
            <input type="hidden" name="callDelayMinutes" value="0" />
          </div>

          <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100">
            <Link href="/leads" className="px-6 py-2.5 rounded-xl text-[0.9rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[0.9rem] font-bold hover:bg-indigo-700 transition-all shadow-[0_2px_8px_rgba(79,70,229,0.25)] hover:-translate-y-px">
              Save Lead & Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
