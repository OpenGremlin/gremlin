import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { preloadImages } from "../../../preloadImages";
import { AGENT_QUERY, AVATARS_QUERY } from "../../../queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { AutoTextarea } from "../../../shared/AutoTextarea";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Agent } from "../../../types";
import { useQuery } from "../../../useQuery";
import { type Avatar, AvatarPicker } from "./AvatarPicker";

interface AgentFormValues {
  name: string;
  soul: string;
  avatar: string;
}

export function AgentConfigPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );
  const avatarsResult = useQuery<{ avatars: Avatar[] }>(AVATARS_QUERY);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const {
    register,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<AgentFormValues>();

  const agent = data?.agent ?? null;

  useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        soul: agent.soul,
        avatar: agent.avatar,
      });
      setSelectedImageUrl(null);
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

  const displayImageUrl = selectedImageUrl || agent.imageUrl;

  return (
    <div className="px-4 pt-6 pb-8">
      <BackButton to={`/agents/${agent.id}`} label="Chat" />

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative group shrink-0"
          >
            <AgentAvatar
              src={displayImageUrl}
              name={agent.name}
              status={agent.status}
              size="lg"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-950 flex items-center justify-center group-hover:bg-neutral-600 transition-colors">
              <Pencil size={12} className="text-neutral-200" />
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <input
              {...register("name")}
              className="w-full bg-transparent text-xl font-semibold text-neutral-100 outline-none border-b border-transparent focus:border-neutral-700 transition-colors"
            />
            <Badge label={agent.status} />
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

        {isDirty && (
          <button
            type="submit"
            className="self-start px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Save
          </button>
        )}
      </form>

      {pickerOpen && (
        <AvatarPicker
          avatars={avatarsResult.data?.avatars ?? []}
          loading={avatarsResult.loading}
          onSelect={(avatar) => {
            setValue("avatar", avatar.id, { shouldDirty: true });
            setSelectedImageUrl(avatar.url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
