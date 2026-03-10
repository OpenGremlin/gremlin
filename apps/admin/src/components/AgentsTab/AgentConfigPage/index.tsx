import { Pencil, Volume2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type {
  RetireAgentMutation,
  UpdateAgentMutation,
} from "../../../graphql/generated/graphql";
import {
  AgentQuery,
  AgentUpdatedSubscription,
  AvatarsQuery,
  RetireAgentMutation as RetireAgentDoc,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useSubscription } from "../../../hooks/useSubscription";
import { useTitle } from "../../../hooks/useTitle";
import { clientLogger } from "../../../logger";
import { preloadImages } from "../../../preloadImages";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { AgentForm, type AgentFormValues } from "../AgentForm";
import { AvatarPicker } from "./AvatarPicker";
import { ToolsConfig } from "./ToolsConfig";
import { VoicePicker } from "./VoicePicker";

export function AgentConfigPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, setData } = useQuery(AgentQuery, {
    id: id ?? "",
  });
  const avatarsResult = useQuery(AvatarsQuery);
  useTitle(data?.agent ? `${data.agent.name} Config` : "Agent Config");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  useSubscription(
    AgentUpdatedSubscription,
    { agentId: id ?? "" },
    useCallback(
      (sub: { agentUpdated: NonNullable<typeof data>["agent"] }) => {
        if (sub.agentUpdated) setData({ agent: sub.agentUpdated });
      },
      [setData],
    ),
  );

  useEffect(() => {
    const avatars = avatarsResult.data?.avatars;
    if (avatars) {
      preloadImages(avatars.map((a) => a.url));
    }
  }, [avatarsResult.data]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  async function onSubmit(values: AgentFormValues) {
    clientLogger.info("Updating agent config", { agentId: id });
    await gql<UpdateAgentMutation>(UpdateAgentDoc, {
      id,
      input: {
        name: values.name,
        soul: values.soul,
      },
    });
    clientLogger.debug("Agent config updated", { agentId: id });
  }

  return (
    <div className="p-6">
      <BackButton to={`/agents/${agent.id}`} label="Chat" />

      <div className="mt-4 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="relative group shrink-0 self-start"
        >
          <AgentAvatar id={agent.id} size={120} />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-950 flex items-center justify-center group-hover:bg-neutral-600 transition-colors">
            <Pencil size={14} className="text-neutral-200" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setVoicePickerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors self-start"
        >
          <Volume2 size={16} className="text-neutral-400" />
          <span className="text-sm text-neutral-200">
            {agent.ttsVoice ?? "No voice"}
          </span>
        </button>

        <AgentForm
          defaultValues={{ id: agent.id, name: agent.name, soul: agent.soul }}
          onSubmit={onSubmit}
          submitLabel="Save"
        />

        <ToolsConfig agent={agent} />
      </div>

      {agent.retired ? (
        <div className="mt-6 rounded-lg bg-neutral-800/50 border border-neutral-700 px-4 py-3 text-sm text-neutral-400">
          This agent is retired.
        </div>
      ) : (
        <button
          type="button"
          onClick={async () => {
            clientLogger.info("Retiring agent", { agentId: id });
            await gql<RetireAgentMutation>(RetireAgentDoc, { id });
            navigate("/agents");
          }}
          className="mt-6 px-4 py-2 rounded-lg bg-red-600/10 text-red-400 text-sm font-medium hover:bg-red-600/20 transition-colors"
        >
          Retire Agent
        </button>
      )}

      {pickerOpen && (
        <AvatarPicker
          avatars={avatarsResult.data?.avatars ?? []}
          loading={avatarsResult.loading}
          onSelect={async (avatar) => {
            setPickerOpen(false);
            clientLogger.info("Updating agent avatar", {
              agentId: id,
              avatarId: avatar.id,
            });
            await gql<UpdateAgentMutation>(UpdateAgentDoc, {
              id,
              input: { avatar: avatar.id },
            });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {voicePickerOpen && (
        <VoicePicker
          currentVoice={agent.ttsVoice}
          onSelect={async (voice) => {
            setVoicePickerOpen(false);
            clientLogger.info("Updating agent voice", {
              agentId: id,
              voice,
            });
            await gql<UpdateAgentMutation>(UpdateAgentDoc, {
              id,
              input: { ttsVoice: voice },
            });
          }}
          onClose={() => setVoicePickerOpen(false)}
        />
      )}
    </div>
  );
}
