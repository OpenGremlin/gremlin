import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SkillTemplateQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { Card } from "../../../../src/shared/Card";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-2.5">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="text-sm text-text-primary">{value}</Text>
    </View>
  );
}

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    id: id ?? "",
  });

  const template = data?.skillTemplate ?? null;

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!template) {
    return <NotFound label="Skill not found." />;
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-5">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <IntegrationLogo id={template.icon ?? template.id} size={44} />
        <View className="flex-1 min-w-0">
          <Text className="text-lg font-semibold text-text-primary">
            {template.displayName ?? template.name}
          </Text>
          <Text className="text-xs text-text-muted font-mono">
            {template.name}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-sm text-text-secondary leading-relaxed">
        {template.description}
      </Text>

      {/* Connections */}
      {template.connections.length > 0 && (
        <Section label="Required Connections">
          <Card className="overflow-hidden">
            {template.connections.map((conn, i) => (
              <View
                key={conn.provider}
                className={`flex-row items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-app-border" : ""}`}
              >
                <IntegrationLogo id={conn.provider} size={24} />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm text-text-primary">
                    {conn.providerName}
                  </Text>
                  <Text className="text-xs text-text-muted" numberOfLines={1}>
                    {conn.reason}
                  </Text>
                </View>
                {conn.optional && (
                  <Text className="text-xs text-text-muted">Optional</Text>
                )}
              </View>
            ))}
          </Card>
        </Section>
      )}

      {/* Details */}
      <Section label="Details">
        <Card className="overflow-hidden">
          <DetailRow label="Version" value={template.version} />
          {template.author && (
            <DetailRow label="Author" value={template.author} />
          )}
          {template.category && (
            <DetailRow label="Category" value={template.category} />
          )}
        </Card>
      </Section>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <Section label="Tags">
          <View className="flex-row flex-wrap gap-1.5">
            {template.tags.map((tag) => (
              <View
                key={tag}
                className="bg-surface-alt/15 rounded-full px-2.5 py-1"
              >
                <Text className="text-xs text-text-muted">{tag}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Help text */}
      <Card className="p-3">
        <Text className="text-xs text-text-muted">
          Assign this skill to an agent from the agent settings page.
        </Text>
      </Card>
    </ScrollView>
  );
}
