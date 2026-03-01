import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Pencil, X } from "lucide-react";
import type { Agent } from "../../types";
import { Badge } from "../../shared/Badge";
import { QueryResult, NotFound } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENT_QUERY, AVATARS_QUERY } from "../../queries";

interface Avatar {
  id: string;
  name: string;
  url: string;
}

export function AgentConfigPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  const displayImageUrl = selectedImageUrl ?? agent.imageUrl;

  return (
    <div className="px-4 pt-6 pb-8">
      <Link
        to={`/agents/${agent.id}`}
        className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <ChevronLeft size={16} className="shrink-0" />
        Chat
      </Link>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative group shrink-0"
          >
            <div
              className={`w-16 h-16 flex items-center justify-center avatar-ring ${
                agent.status === "ACTIVE"
                  ? "avatar-ring-active"
                  : agent.status === "SCHEDULED"
                    ? "avatar-ring-scheduled"
                    : "avatar-ring-idle"
              }`}
            >
              <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden text-lg text-neutral-400 font-medium">
                <img
                  src={displayImageUrl}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.textContent =
                      agent.name[0];
                  }}
                />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-950 flex items-center justify-center group-hover:bg-neutral-600 transition-colors">
              <Pencil size={12} className="text-neutral-200" />
            </div>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-100">
              {agent.name}
            </h1>
            <Badge label={agent.status} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Portrait</span>
          <span className="text-sm text-neutral-100 font-mono">
            {agent.portraitId}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Soul</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {agent.soul}
          </p>
        </div>
      </div>

      {pickerOpen && (
        <AvatarPicker
          onSelect={(avatar) => {
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
  onSelect,
  onClose,
}: {
  onSelect: (avatar: Avatar) => void;
  onClose: () => void;
}) {
  const { data, loading } = useQuery<{ avatars: Avatar[] }>(AVATARS_QUERY);
  const avatars = data?.avatars ?? [];

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
