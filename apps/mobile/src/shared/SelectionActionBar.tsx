import { FolderInput, Share2, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationTheme } from "../lib/useNavigationTheme";

interface SelectionActionBarProps {
  onDelete: () => void;
  onShare: () => void;
  onMove: () => void;
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
  color,
}: {
  icon: typeof Trash2;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center gap-1 px-4 py-2 active:opacity-60"
    >
      <Icon size={20} color={color} />
      <Text className="text-xs text-text-secondary">{label}</Text>
    </Pressable>
  );
}

export function SelectionActionBar({
  onDelete,
  onShare,
  onMove,
  disabled,
}: SelectionActionBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useNavigationTheme();

  return (
    <View
      className="border-t border-app-border bg-surface"
      style={{ paddingBottom: insets.bottom }}
    >
      <View
        className="flex-row justify-around py-2"
        style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}
      >
        <ActionButton
          icon={Share2}
          label="Share"
          onPress={onShare}
          color={colors.accentIndicator}
        />
        <ActionButton
          icon={FolderInput}
          label="Move"
          onPress={onMove}
          color={colors.accentIndicator}
        />
        <ActionButton
          icon={Trash2}
          label="Delete"
          onPress={onDelete}
          color="#ef4444"
        />
      </View>
    </View>
  );
}
