import { useQuery } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { SkillTemplateQuery } from "../../src/graphql/queries";
import { Sheet } from "../../src/shared/Sheet";
import { SkillDetailContent } from "../../src/shared/SkillDetailContent";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery(SkillTemplateQuery, {
    variables: { id: id ?? "" },
    skip: !id,
  });

  const template = data?.skillTemplate;
  const title = template?.displayName ?? template?.name ?? "Skill";

  return (
    <Sheet title={title}>
      <ScrollView contentContainerClassName="px-4 pt-4 pb-16">
        {id ? <SkillDetailContent id={id} /> : null}
      </ScrollView>
    </Sheet>
  );
}
