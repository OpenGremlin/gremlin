import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView } from "react-native";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { Sheet } from "../../src/shared/Sheet";
import { SkillDetailContent } from "../../src/shared/SkillDetailContent";

export interface SkillDetailSheetPayload {
  id: string;
  title: string;
}

export default function SkillDetailSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<SkillDetailSheetPayload>(id);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  return (
    <Sheet title={payload.title}>
      <ScrollView contentContainerClassName="px-4 pt-4 pb-16">
        <SkillDetailContent id={payload.id} />
      </ScrollView>
    </Sheet>
  );
}
