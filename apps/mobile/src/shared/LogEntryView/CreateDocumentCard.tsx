import { ActivityIndicator, Text, View } from "react-native";
import type { AgentLogsQuery } from "../../graphql/generated/graphql";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { FileCard } from "../FileCard";
import { ToolBlock } from "./ToolBlock";

type FileNode =
  AgentLogsQuery["agentLogs"]["edges"][number]["node"]["files"][number];

export function CreateDocumentCard({
  toolInput,
  toolResult,
  files,
  createdAt,
  showTimestamp,
}: {
  toolInput: Record<string, unknown> | null;
  toolResult: Record<string, unknown> | null;
  files?: FileNode[];
  createdAt: string;
  showTimestamp: boolean;
}) {
  const colors = useNavigationTheme();
  const docPath =
    (toolResult?.path as string | undefined) ??
    (toolInput?.path as string | undefined);

  const file = docPath ? files?.find((f) => f.path === docPath) : undefined;

  if (file) {
    return (
      <View className="py-2">
        <FileCard file={file} />
      </View>
    );
  }

  if (toolResult && docPath) {
    // Fallback: tool finished but file not in the files array yet.
    // Build a synthetic DocumentRender file for display.
    const syntheticFile: FileNode = {
      path: docPath,
      name: docPath.split("/").pop() ?? "Document",
      sizeBytes: 0,
      mimeType: "text/markdown",
      modifiedAt: createdAt,
      render: {
        __typename: "DocumentRender",
        markdown: (toolInput?.body as string) ?? "",
        title: (toolInput?.title as string) ?? null,
      },
    };
    return (
      <View className="py-2">
        <FileCard file={syntheticFile} />
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
