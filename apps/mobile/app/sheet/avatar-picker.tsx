import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import type { AvatarPickerSheetPayload } from "../../src/shared/AgentAvatar/AvatarPicker";
import { AvatarPickerContent } from "../../src/shared/AgentAvatar/AvatarPickerContent";
import { Sheet } from "../../src/shared/Sheet";

export default function AvatarPickerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<AvatarPickerSheetPayload>(id);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  return (
    <Sheet title="Choose Avatar">
      <AvatarPickerContent
        avatars={payload.avatars}
        loading={payload.loading}
        onSelect={(avatar) => {
          payload.onSelect(avatar);
          router.back();
        }}
      />
    </Sheet>
  );
}
