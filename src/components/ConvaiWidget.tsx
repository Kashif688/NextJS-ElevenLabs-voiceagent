"use client";

import React from "react";
import Script from "next/script";

export default function ConvaiWidget({ agentId }: { agentId?: string }) {
  if (!agentId) return null;

  return (
    <>
      {React.createElement("elevenlabs-convai", { "agent-id": agentId })}
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
    </>
  );
}
