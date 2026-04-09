import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView } from "react-native";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import type { DocumentSheetPayload } from "../../src/shared/DocumentCard";
import { DocumentReadButton } from "../../src/shared/DocumentReadButton";
import { Markdown } from "../../src/shared/LogEntryView/Markdown";
import { Sheet } from "../../src/shared/Sheet";

export default function DocumentSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<DocumentSheetPayload>(id);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  return (
    <Sheet title={payload.title}>
      <ScrollView
        className="flex-1 bg-bg px-10 py-4"
        contentContainerClassName="pb-16"
      >
        <DocumentReadButton markdown={payload.body} />
        <Markdown>{payload.body}</Markdown>
      </ScrollView>
    </Sheet>
  );
}
