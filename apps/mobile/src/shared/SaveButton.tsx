import { Button } from "./Button";

interface SaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
}

export function SaveButton({
  onPress,
  disabled,
  saving,
  label = "Save",
}: SaveButtonProps) {
  return (
    <Button onPress={onPress} disabled={disabled} loading={saving}>
      {label}
    </Button>
  );
}
