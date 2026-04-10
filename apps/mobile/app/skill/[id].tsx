import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { Sheet } from "../../src/shared/Sheet";
import { SkillDetailContent } from "../../src/shared/SkillDetailContent";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Sheet title="">
      <ScrollView contentContainerClassName="px-4 pt-4 pb-16">
        {id ? <SkillDetailContent id={id} /> : null}
      </ScrollView>
    </Sheet>
  );
}
