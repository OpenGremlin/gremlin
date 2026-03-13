import { Button } from "./Button";

interface DestructiveButtonProps {
  onPress: () => void;
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DestructiveButton({
  onPress,
  label,
  loadingLabel,
  loading,
  disabled,
  size,
}: DestructiveButtonProps) {
  return (
    <Button
      onPress={onPress}
      variant="destructive"
      disabled={disabled}
      loading={loading}
      loadingText={loadingLabel}
      size={size}
    >
      {label}
    </Button>
  );
}
