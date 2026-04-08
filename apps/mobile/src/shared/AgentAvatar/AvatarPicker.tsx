import { router } from "expo-router";
import { openSheet } from "../../lib/sheetStore";
import type { Avatar } from "./AvatarPickerContent";

export type { Avatar } from "./AvatarPickerContent";

/** Payload type stored in sheetStore for the avatar-picker sheet route. */
export interface AvatarPickerSheetPayload {
  avatars: Avatar[];
  loading: boolean;
  onSelect: (avatar: Avatar) => void;
}

/** Open the avatar picker sheet route. */
export function presentAvatarPicker(payload: AvatarPickerSheetPayload): void {
  const sheetId = openSheet<AvatarPickerSheetPayload>(payload);
  router.push(`/sheet/avatar-picker?id=${sheetId}`);
}
