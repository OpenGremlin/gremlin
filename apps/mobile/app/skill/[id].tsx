import { useLocalSearchParams } from "expo-router";
import { Sheet } from "../../src/shared/Sheet";
import { SkillDetailContent } from "../../src/shared/SkillDetailContent";
import { TabScrollView } from "../../src/shared/TabScrollView";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Sheet title="">
      <TabScrollView contentContainerClassName="px-4 pt-4">
        {id ? <SkillDetailContent id={id} /> : null}
      </TabScrollView>
    </Sheet>
  );
}
