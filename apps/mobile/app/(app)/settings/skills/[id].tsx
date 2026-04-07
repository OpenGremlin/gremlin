import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { SkillDetailContent } from "../../../../src/shared/SkillDetailContent";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1"
      contentContainerClassName="px-4 pt-6 pb-16"
    >
      <SkillDetailContent id={id ?? ""} />
    </ScrollView>
  );
}
