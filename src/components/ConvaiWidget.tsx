"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

export default function ConvaiWidget({ agentId }: { agentId?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !agentId) return null;

  return (
    <>
      {React.createElement("elevenlabs-convai", { 
        "agent-id": agentId,
        "dynamic-variables": JSON.stringify({ first_name: "Tester" })
      })}
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
    </>
  );
}
