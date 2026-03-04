import { File, Folder } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WorkspaceEntriesQuery } from "../../graphql/queries";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";

function Breadcrumbs({
  dirPath,
  onNavigate,
}: {
  dirPath: string;
  onNavigate: (path: string) => void;
}) {
  const segments = dirPath ? dirPath.split("/") : [];

  return (
    <div className="flex items-center gap-1 text-sm text-neutral-400 overflow-x-auto px-4 py-3 border-b border-neutral-800">
      <button
        type="button"
        onClick={() => onNavigate("")}
        className="text-indigo-400 hover:text-indigo-300 shrink-0"
      >
        /workspace
      </button>
      {segments.map((seg, i) => {
        const partial = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={partial} className="flex items-center gap-1">
            <span className="text-neutral-600">/</span>
            {isLast ? (
              <span className="text-neutral-200">{seg}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(partial)}
                className="text-indigo-400 hover:text-indigo-300"
              >
                {seg}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function FilesTab() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const dirPath = params.get("path") ?? "";

  const { data, loading, error } = useQuery(WorkspaceEntriesQuery, {
    path: dirPath,
  });

  const entries = data?.workspaceEntries ?? [];

  const navigateToDir = (path: string) => {
    setParams(path ? { path } : {});
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Breadcrumbs dirPath={dirPath} onNavigate={navigateToDir} />
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50">
        {entries.map((entry) => (
          <button
            key={entry.path}
            type="button"
            onClick={() => {
              if (entry.isDirectory) {
                navigateToDir(entry.path);
              } else {
                navigate(`/files/view?path=${encodeURIComponent(entry.path)}`);
              }
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-neutral-900 transition-colors"
          >
            {entry.isDirectory ? (
              <Folder size={18} className="text-indigo-400 shrink-0" />
            ) : (
              <File size={18} className="text-neutral-500 shrink-0" />
            )}
            <span className="text-neutral-200 text-sm truncate flex-1">
              {entry.name}
            </span>
            {!entry.isDirectory && entry.size != null && (
              <span className="text-neutral-600 text-xs shrink-0">
                {formatSize(entry.size)}
              </span>
            )}
          </button>
        ))}
        {!loading && entries.length === 0 && (
          <p className="px-4 py-8 text-sm text-neutral-500 text-center">
            Empty directory
          </p>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
