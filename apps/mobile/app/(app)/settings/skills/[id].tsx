import { useLocalSearchParams } from "expo-router";
import { SkillDetailContent } from "../../../../src/shared/SkillDetailContent";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <TabScrollView contentContainerClassName="px-4 pt-6">
      <SkillDetailContent id={id ?? ""} />
    </TabScrollView>
  );
}
