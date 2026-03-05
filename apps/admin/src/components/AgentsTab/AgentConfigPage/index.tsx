import { Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type { UpdateAgentMutation } from "../../../graphql/generated/graphql";
import {
  AgentQuery,
  AgentUpdatedSubscription,
  AvatarsQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../../graphql/queries";
import { preloadImages } from "../../../preloadImages";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { useSubscription } from "../../../useSubscription";
import { AgentForm, type AgentFormValues } from "../AgentForm";
import { AvatarPicker } from "./AvatarPicker";

export function AgentConfigPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(AgentQuery, {
    id: id ?? "",
  });
  const avatarsResult = useQuery(AvatarsQuery);
  const [pickerOpen, setPickerOpen] = useState(false);

  useSubscription(
    AgentUpdatedSubscription,
    { agentId: id ?? "" },
    useCallback(() => refetch(), [refetch]),
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
    await gql<UpdateAgentMutation>(UpdateAgentDoc, {
      id,
      input: {
        name: values.name,
        soul: values.soul,
      },
    });
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

        <AgentForm
          defaultValues={{ id: agent.id, name: agent.name, soul: agent.soul }}
          onSubmit={onSubmit}
          submitLabel="Save"
        />
      </div>

      {pickerOpen && (
        <AvatarPicker
          avatars={avatarsResult.data?.avatars ?? []}
          loading={avatarsResult.loading}
          onSelect={async (avatar) => {
            setPickerOpen(false);
            await gql<UpdateAgentMutation>(UpdateAgentDoc, {
              id,
              input: { avatar: avatar.id },
            });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
