import { Button } from "./Button";

interface DestructiveButtonProps {
  onPress: () => void;
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function DestructiveButton({
  onPress,
  label,
  loadingLabel,
  loading,
  disabled,
}: DestructiveButtonProps) {
  return (
    <Button
      onPress={onPress}
      variant="destructive"
      disabled={disabled}
      loading={loading}
      loadingText={loadingLabel}
    >
      {label}
    </Button>
  );
}
