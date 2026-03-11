import { ActivityIndicator, Text, View } from "react-native";
import type { Document } from "../../graphql/generated/graphql";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { DocumentCard } from "./DocumentCard";
import { ToolBlock } from "./ToolBlock";

export function CreateDocumentCard({
  toolInput,
  toolResult,
  documents,
  createdAt,
  showTimestamp,
}: {
  toolInput: Record<string, unknown> | null;
  toolResult: Record<string, unknown> | null;
  documents?: Document[];
  createdAt: string;
  showTimestamp: boolean;
}) {
  const colors = useNavigationTheme();
  const docPath =
    (toolResult?.path as string | undefined) ??
    (toolInput?.path as string | undefined);

  const doc = docPath ? documents?.find((d) => d.path === docPath) : undefined;

  if (doc) {
    return (
      <View className="py-2">
        <DocumentCard doc={doc} />
      </View>
    );
  }

  if (toolResult && docPath) {
    return (
      <View className="py-2">
        <DocumentCard
          doc={{
            path: docPath,
            title: (toolInput?.title as string) ?? "Document",
            body: (toolInput?.body as string) ?? null,
          }}
        />
      </View>
    );
  }

  return (
    <ToolBlock
      label={`Creating ${(toolInput?.title as string) ?? "document"}...`}
      createdAt={createdAt}
      showTimestamp={showTimestamp}
    >
      <View className="flex-row items-center gap-2 px-3 py-2">
        <ActivityIndicator size="small" color={colors.iconMuted} />
        <Text className="text-xs text-text-muted">Writing...</Text>
      </View>
    </ToolBlock>
  );
}
