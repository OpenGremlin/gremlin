import { Button } from "./Button";

interface SaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function SaveButton({
  onPress,
  disabled,
  saving,
  label = "Save",
  size,
}: SaveButtonProps) {
  return (
    <Button onPress={onPress} disabled={disabled} loading={saving} size={size}>
      {label}
    </Button>
  );
}
