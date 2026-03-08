import { X } from "lucide-react";
import type { Avatar } from "../../../../graphql/generated/graphql";

export function AvatarPicker({
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
      role="dialog"
      aria-label="Choose Avatar"
      className="fixed inset-0 z-50 flex items-end justify-center"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-t-2xl max-h-[70vh] flex flex-col">
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
