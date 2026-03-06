import { useNavigate } from "react-router-dom";
import { gql } from "../../../auth";
import type { CreateAgentMutation } from "../../../graphql/generated/graphql";
import { CreateAgentMutation as CreateAgentDoc } from "../../../graphql/queries";
import { clientLogger } from "../../../logger";
import { BackButton } from "../../../shared/BackButton";
import { AgentForm, type AgentFormValues } from "../AgentForm";

export function NewAgentPage() {
  const navigate = useNavigate();

  async function onSubmit(values: AgentFormValues) {
    clientLogger.info("Creating agent", {
      agentId: values.id,
      name: values.name,
    });
    const result = await gql<CreateAgentMutation>(CreateAgentDoc, {
      input: {
        id: values.id,
        name: values.name,
        soul: values.soul,
      },
    });
    if (result.createAgent) {
      clientLogger.info("Agent created", { agentId: result.createAgent.id });
      navigate(`/agents/${result.createAgent.id}/config`);
    }
  }

  return (
    <div className="p-6">
      <BackButton to="/agents" label="Agents" />

      <h2 className="mt-4 mb-4 text-lg font-medium text-neutral-100">
        New Agent
      </h2>

      <AgentForm
        onSubmit={onSubmit}
        submitLabel="Create"
        isAlwaysVisible
        isNew
      />
    </div>
  );
}
