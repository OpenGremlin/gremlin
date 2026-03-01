import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import Markdown from "react-markdown";
import { DOCUMENT_UPDATED_SUBSCRIPTION } from "../../../queries";
import type { Document } from "../../../types";
import { useSubscription } from "../../../useSubscription";

export function DocumentCard({ doc: initial }: { doc: Document }) {
  const [doc, setDoc] = useState(initial);
  const [expanded, setExpanded] = useState(false);

  // Live-update document content
  useSubscription<{ documentUpdated: Document }>(
    DOCUMENT_UPDATED_SUBSCRIPTION,
    { id: doc.id },
    useCallback((data) => {
      setDoc((prev) => ({ ...prev, ...data.documentUpdated }));
    }, []),
  );

  const preview =
    doc.body.length > 100 ? doc.body.slice(0, 100) + "..." : doc.body;

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden transition-colors hover:border-neutral-700"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText size={14} className="text-indigo-400 shrink-0" />
        <span className="text-sm font-medium text-neutral-200 flex-1 truncate">
          {doc.title}
        </span>
        {expanded ? (
          <ChevronDown size={14} className="text-neutral-500 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-neutral-500 shrink-0" />
        )}
      </div>
      {expanded ? (
        <div className="px-3 pb-3 prose prose-invert prose-sm max-w-none text-neutral-300">
          <Markdown>{doc.body}</Markdown>
        </div>
      ) : (
        <p className="px-3 pb-2 text-xs text-neutral-500 line-clamp-2">
          {preview}
        </p>
      )}
    </button>
  );
}
