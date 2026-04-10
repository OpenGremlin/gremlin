import { BottomSheet } from "../BottomSheet";
import type { Avatar } from "./AvatarPickerContent";
import { AvatarPickerContent } from "./AvatarPickerContent";

export type { Avatar } from "./AvatarPickerContent";

export function AvatarPicker({
  visible,
  avatars,
  loading,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  avatars: Avatar[];
  loading: boolean;
  onSelect: (avatar: Avatar) => void;
  onDismiss: () => void;
}) {
  return (
    <BottomSheet visible={visible} title="Choose Avatar" onDismiss={onDismiss}>
      <AvatarPickerContent
        avatars={avatars}
        loading={loading}
        onSelect={(avatar) => {
          onSelect(avatar);
          onDismiss();
        }}
      />
    </BottomSheet>
  );
}
