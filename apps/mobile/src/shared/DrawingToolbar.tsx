import { Eraser, Paintbrush, Pen, Trash2, Undo2 } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type DrawingTool = "thin" | "thick" | "eraser";

const COLORS = [
  "#000000",
  "#EF4444",
  "#3B82F6",
  "#22C55E",
  "#F97316",
  "#8B5CF6",
];

const TOOL_ICONS = {
  thin: Pen,
  thick: Paintbrush,
  eraser: Eraser,
} as const;

interface DrawingToolbarProps {
  selectedTool: DrawingTool;
  selectedColor: string;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
}

export function DrawingToolbar({
  selectedTool,
  selectedColor,
  onToolChange,
  onColorChange,
  onUndo,
  onClear,
  canUndo,
}: DrawingToolbarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom + 8,
        paddingTop: 12,
        paddingHorizontal: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        gap: 12,
      }}
    >
      {/* Tools row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {(["thin", "thick", "eraser"] as const).map((tool) => {
          const Icon = TOOL_ICONS[tool];
          const isSelected = selectedTool === tool;
          return (
            <Pressable
              key={tool}
              onPress={() => onToolChange(tool)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "#E5E7EB" : "transparent",
              }}
            >
              <Icon size={20} color={isSelected ? "#111827" : "#6B7280"} />
            </Pressable>
          );
        })}

        <View
          style={{
            width: 1,
            height: 24,
            backgroundColor: "#D1D5DB",
            marginHorizontal: 4,
          }}
        />

        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            opacity: canUndo ? 1 : 0.3,
          }}
        >
          <Undo2 size={20} color="#6B7280" />
        </Pressable>

        <Pressable
          onPress={onClear}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={20} color="#6B7280" />
        </Pressable>
      </View>

      {/* Colors row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {COLORS.map((color) => {
          const isSelected = selectedColor === color;
          return (
            <Pressable
              key={color}
              onPress={() => onColorChange(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: color,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected ? "#3B82F6" : "#D1D5DB",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
