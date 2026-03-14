import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SkillTemplateQuery } from "../../../../../src/graphql/queries";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { Badge } from "../../../../../src/shared/Badge";
import { Card } from "../../../../../src/shared/Card";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";

export default function SkillTemplateScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    id: templateId ?? "",
  });

  const template = data?.skillTemplate ?? null;

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!template) {
    return <NotFound label="Skill template not found." />;
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-4">
      <View>
        <Text className="text-xl font-semibold text-text-primary mb-2">
          {template.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Badge label={`v${template.version}`} />
          {template.category ? <Badge label={template.category} /> : null}
          {template.hasInstall ? <Badge label="CLI" /> : null}
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Description</Text>
        <Text className="text-sm text-text-secondary leading-relaxed">
          {template.description}
        </Text>
      </View>

      {template.author ? (
        <View className="gap-1">
          <Text className="text-xs text-text-muted">Author</Text>
          <Text className="text-sm text-text-muted">{template.author}</Text>
        </View>
      ) : null}

      {template.connections.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-text-muted">Required Connections</Text>
          {template.connections.map((conn) => (
            <Card key={conn.provider} className="p-3 gap-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-text-primary">
                  {conn.providerName}
                </Text>
                {conn.optional ? (
                  <Text className="text-xs text-text-muted">(optional)</Text>
                ) : null}
              </View>
              <Text className="text-xs text-text-muted">{conn.reason}</Text>
            </Card>
          ))}
        </View>
      )}

      {template.tags && template.tags.length > 0 && (
        <View className="gap-1">
          <Text className="text-xs text-text-muted">Tags</Text>
          <View className="flex-row flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Text
                key={tag}
                className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded"
              >
                {tag}
              </Text>
            ))}
          </View>
        </View>
      )}

      <Card className="p-3">
        <Text className="text-xs text-text-muted">
          Skills are assigned to agents from the agent configuration page.
        </Text>
      </Card>
    </ScrollView>
  );
}
