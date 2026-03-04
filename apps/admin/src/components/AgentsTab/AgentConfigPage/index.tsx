import { Check, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import { AutoTextarea } from "../../../shared/AutoTextarea";
import { BackButton } from "../../../shared/BackButton";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { useSubscription } from "../../../useSubscription";
import { AvatarPicker } from "./AvatarPicker";

interface AgentFormValues {
  name: string;
  soul: string;
}

export function AgentConfigPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(AgentQuery, {
    id: id ?? "",
  });
  const avatarsResult = useQuery(AvatarsQuery);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);

  useSubscription(
    AgentUpdatedSubscription,
    { agentId: id ?? "" },
    useCallback(() => refetch(), [refetch]),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<AgentFormValues>();

  const agent = data?.agent ?? null;

  useEffect(() => {
    if (agent && !initialized.current) {
      initialized.current = true;
      reset({
        name: agent.name,
        soul: agent.soul,
      });
    }
  }, [agent, reset]);

  useEffect(() => {
    const avatars = avatarsResult.data?.avatars;
    if (avatars) {
      preloadImages(avatars.map((a) => a.url));
    }
  }, [avatarsResult.data]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  async function onSubmit(values: AgentFormValues) {
    const result = await gql<UpdateAgentMutation>(UpdateAgentDoc, {
      id,
      input: {
        name: values.name,
        soul: values.soul,
      },
    });
    if (result.updateAgent) {
      reset({
        name: result.updateAgent.name,
        soul: result.updateAgent.soul,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6">
      <BackButton to={`/agents/${agent.id}`} label="Chat" />

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Avatar Image</span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="relative group shrink-0 self-start"
            >
              <AgentAvatar id={agent.id} />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-950 flex items-center justify-center group-hover:bg-neutral-600 transition-colors">
                <Pencil size={12} className="text-neutral-200" />
              </div>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="name-field" className="text-xs text-neutral-500">
              Name
            </label>
            <input
              id="name-field"
              {...register("name")}
              className="w-full bg-neutral-900 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="soul-field" className="text-xs text-neutral-500">
            Soul
          </label>
          <AutoTextarea
            id="soul-field"
            {...register("soul")}
            minRows={3}
            className="w-full bg-neutral-900 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving\u2026" : "Save"}
            </button>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check size={14} />
              Saved
            </span>
          )}
        </div>
      </form>

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
