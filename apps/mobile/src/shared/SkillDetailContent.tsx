import { useQuery } from "@apollo/client";
import { Text, View } from "react-native";
import { SkillTemplateQuery } from "../graphql/queries";
import { Card } from "./Card";
import { IntegrationLogo } from "./IntegrationLogo";
import { Markdown } from "./LogEntryView/Markdown";
import { NotFound, QueryResult } from "./QueryResult";

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-text-muted uppercase tracking-wider">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function SkillDetailContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    variables: { id },
  });

  const template = data?.skillTemplate ?? null;

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!template) {
    return <NotFound label="Skill not found." />;
  }

  return (
    <View className="gap-5">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <IntegrationLogo id={template.icon ?? template.id} size={44} />
        <View className="flex-1 min-w-0">
          <Text className="text-xl font-semibold text-text-primary">
            {template.displayName ?? template.name}
          </Text>
          <Text className="text-sm font-bold text-text-muted font-mono">
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

      {/* Instructions (SKILL.md body) */}
      {template.instructions ? (
        <View className="bg-bg -mx-4 px-4 py-4 mt-1 border-t border-app-border">
          <Markdown baseFontSize={14}>{template.instructions}</Markdown>
        </View>
      ) : null}
    </View>
  );
}
