import { Loader2 } from "lucide-react";
import type { Document } from "../../../../graphql/generated/graphql";
import { DocumentCard } from "../../../../shared/DocumentCard";
import { ToolBlock } from "./ToolBlock";

export function CreateDocumentCard({
  id,
  toolInput,
  toolResult,
  documents,
  createdAt,
  showTimestamp,
}: {
  id: string;
  toolInput: Record<string, unknown> | null;
  toolResult: Record<string, unknown> | null;
  documents?: Document[];
  createdAt: string;
  showTimestamp: boolean;
}) {
  const docPath =
    (toolResult?.path as string | undefined) ??
    (toolInput?.path as string | undefined);

  const doc = docPath ? documents?.find((d) => d.path === docPath) : undefined;

  if (doc) {
    return (
      <div id={id} className="py-1">
        <DocumentCard doc={doc} />
      </div>
    );
  }

  if (toolResult && docPath) {
    return (
      <div id={id} className="py-1">
        <DocumentCard
          doc={{
            path: docPath,
            title: (toolInput?.title as string) ?? "Document",
            body: (toolInput?.body as string) ?? null,
          }}
        />
      </div>
    );
  }

  return (
    <ToolBlock
      id={id}
      label={`Creating ${(toolInput?.title as string) ?? "document"}...`}
      createdAt={createdAt}
      showTimestamp={showTimestamp}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 size={12} className="text-neutral-500 animate-spin" />
        <span className="text-xs text-neutral-400">Writing...</span>
      </div>
    </ToolBlock>
  );
}
