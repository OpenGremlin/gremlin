import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Pencil, X } from "lucide-react";
import type { Agent } from "../../types";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { BackButton } from "../../shared/BackButton";
import { Badge } from "../../shared/Badge";
import { QueryResult, NotFound } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENT_QUERY, AVATARS_QUERY } from "../../queries";
import { preloadImages } from "../../preloadImages";
import { AutoTextarea } from "../../shared/AutoTextarea";

interface Avatar {
  id: string;
  name: string;
  url: string;
}

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
  // Eagerly fetch avatars so they're ready when the picker opens
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

  // Reset form when agent data loads
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

  // Preload avatar images as soon as URLs are available
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
            <AgentAvatar src={displayImageUrl} name={agent.name} status={agent.status} size="lg" />
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
          <label className="text-xs text-neutral-500">Soul</label>
          <AutoTextarea
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

function AvatarPicker({
  avatars,
  loading,
  onSelect,
  onClose,
}: {
  avatars: Avatar[];
  loading: boolean;
  onSelect: (avatar: Avatar) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg bg-neutral-900 rounded-t-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-semibold text-neutral-100">
            Choose Avatar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {loading ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              Loading avatars...
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onSelect(avatar)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800">
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 truncate w-full text-center">
                    {avatar.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
