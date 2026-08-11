"use client";

import React, { useState } from "react";
import OutcomeCircleChart, { OutcomeItem } from "./OutcomeCircleChart";
import BatchConversationsList from "./BatchConversationsList";

export default function BatchAnalyticsSection({
  statusData = [],
  outcomeData = [],
  recipients = [],
  callLogs = [],
}: {
  statusData?: OutcomeItem[];
  outcomeData?: OutcomeItem[];
  recipients: any[];
  callLogs: any[];
}) {
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<string>("all");

  const handleSelectOutcome = (key: string) => {
    // Toggle filter: if already selected, reset to 'all', else set key
    setSelectedOutcomeFilter((prev) => (prev === key ? "all" : key));
  };

  return (
    <div className="space-y-6">
      {/* 2-Level Donut / Circle Chart */}
      <OutcomeCircleChart
        statusData={statusData}
        outcomeData={outcomeData}
        onSelectOutcome={handleSelectOutcome}
      />

      {/* Filterable Conversations Table */}
      <BatchConversationsList
        recipients={recipients}
        callLogs={callLogs}
        selectedFilter={selectedOutcomeFilter}
        onSelectFilter={handleSelectOutcome}
      />
    </div>
  );
}
