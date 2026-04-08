import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { dismissSheet, useSheetPayload } from "../../../src/lib/sheetStore";
import {
  ModelDetailContent,
  type ModelDetailSheetPayload,
} from "../../../src/shared/ModelDetail";
import { Sheet } from "../../../src/shared/Sheet";

export default function ModelDetailSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<ModelDetailSheetPayload>(id);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  return (
    <Sheet title={payload.model.name}>
      <ModelDetailContent model={payload.model} actions={payload.actions} />
    </Sheet>
  );
}
