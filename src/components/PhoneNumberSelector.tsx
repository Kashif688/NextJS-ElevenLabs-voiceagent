"use client";

import { useTransition, useState } from "react";
import { switchPhoneNumber } from "@/actions/agent.actions";
import { Phone, Check } from "lucide-react";

export default function PhoneNumberSelector({
  phoneNumbers = [],
  currentPhoneNumberId,
}: {
  phoneNumbers?: any[];
  currentPhoneNumberId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Determine current active phone number string
  const matchedPhone = phoneNumbers?.find(p => p.phone_number_id === currentPhoneNumberId);
  const displayName = isPending
    ? "Switching..."
    : (matchedPhone?.phone_number || currentPhoneNumberId || "Not selected");

  const handleSwitch = (phoneId: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await switchPhoneNumber(phoneId);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-[0.95rem] font-medium text-slate-800 shadow-sm hover:border-indigo-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Phone size={16} className="text-indigo-500" />
          {displayName}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
            {phoneNumbers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">No phone numbers available</div>
            ) : (
              phoneNumbers.map((phone) => (
                <button
                  key={phone.phone_number_id}
                  type="button"
                  onClick={() => handleSwitch(phone.phone_number_id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    currentPhoneNumberId === phone.phone_number_id
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {phone.phone_number} 
                    {phone.label && <span className="text-xs text-slate-400 font-normal px-2 py-0.5 bg-slate-100 rounded-md">({phone.label})</span>}
                  </span>
                  {currentPhoneNumberId === phone.phone_number_id && <Check size={16} className="text-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
