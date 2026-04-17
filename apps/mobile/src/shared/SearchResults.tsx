import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SearchMode } from "../graphql/generated/graphql";
import { WorkspaceSearchQuery } from "../graphql/queries";
import { FileTypeIcon } from "./fileTypeAppearance";
import { QueryGate } from "./QueryResult";

function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) {
    return (
      <Text className={`font-mono text-sm ${className ?? ""}`}>{text}</Text>
    );
  }

  return (
    <Text className={`font-mono text-sm ${className ?? ""}`}>
      {text.slice(0, idx)}
      <Text className="font-bold text-text-primary">
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

function ContentSnippet({
  matchLine,
  matchContent,
  contextBefore,
  contextAfter,
  query,
}: {
  matchLine: number;
  matchContent: string;
  contextBefore: string[] | null | undefined;
  contextAfter: string[] | null | undefined;
  query: string;
}) {
  return (
    <View className="mt-1.5 rounded-md bg-surface-secondary px-3 py-2">
      {contextBefore?.map((line, i) => (
        <View
          key={`before-${matchLine - (contextBefore.length - i)}`}
          className="flex-row"
        >
          <Text className="font-mono text-sm text-text-faint w-8">
            {matchLine - (contextBefore.length - i)}
          </Text>
          <Text className="font-mono text-sm text-text-faint flex-1">
            {line}
          </Text>
        </View>
      ))}
      <View className="flex-row">
        <Text className="font-mono text-base text-text-muted w-8">
          {matchLine}
        </Text>
        <HighlightedText
          text={matchContent}
          query={query}
          className="text-text-secondary flex-1"
        />
      </View>
      {contextAfter?.map((line, i) => (
        <View key={`after-${matchLine + 1 + i}`} className="flex-row">
          <Text className="font-mono text-sm text-text-faint w-8">
            {matchLine + 1 + i}
          </Text>
          <Text className="font-mono text-sm text-text-faint flex-1">
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SearchResults({
  query,
  mode = SearchMode.All,
}: {
  query: string;
  mode?: SearchMode;
}) {
  const { data, loading, error } = useQuery(WorkspaceSearchQuery, {
    variables: { query, mode },
    skip: !query,
    fetchPolicy: "network-only",
  });
  const results = data?.workspaceSearch ?? [];

  return (
    <QueryGate loading={loading} error={error} data={data}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerClassName="pb-6"
      >
        {results.map((result) => (
          <Pressable
            key={`${result.path}:${result.matchLine ?? "name"}`}
            onPress={() =>
              router.push({
                pathname: "/file/[...path]",
                params: { path: result.path.split("/") },
              })
            }
            className="px-4 py-3 border-b border-border-subtle active:bg-surface"
          >
            <View className="flex-row items-center gap-3">
              <FileTypeIcon fileType={result.fileType} />
              <Text
                className="text-lg text-text-secondary flex-1"
                numberOfLines={1}
              >
                {result.path}
                {result.matchLine != null && (
                  <Text className="text-text-faint">:{result.matchLine}</Text>
                )}
              </Text>
            </View>

            {result.matchType === "content" &&
              result.matchContent != null &&
              result.matchLine != null && (
                <ContentSnippet
                  matchLine={result.matchLine}
                  matchContent={result.matchContent}
                  contextBefore={result.matchContextBefore}
                  contextAfter={result.matchContextAfter}
                  query={query}
                />
              )}
          </Pressable>
        ))}

        {!loading && results.length === 0 && (
          <Text className="px-4 py-8 text-base text-text-muted text-center">
            No results found
          </Text>
        )}
      </ScrollView>
    </QueryGate>
  );
}
