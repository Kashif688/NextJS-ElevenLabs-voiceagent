import { getLeads } from "@/actions/lead.actions";
import { getCurrentAgentId, fetchAgentDetails } from "@/actions/agent.actions";
import CreateBatchClientForm from "./CreateBatchClientForm";

export const dynamic = "force-dynamic";

export default async function CreateBatchPage() {
  const leads = await getLeads();
  const currentAgentId = await getCurrentAgentId() || "";
  const agentDetails = await fetchAgentDetails();
  const currentAgentName = agentDetails?.name || "Emma-American";

  return (
    <CreateBatchClientForm
      leads={leads}
      currentAgentId={currentAgentId}
      currentAgentName={currentAgentName}
    />
  );
}
