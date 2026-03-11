import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatTime } from "../formatDate";

export function ToolBlock({
  label,
  content,
  createdAt,
  showTimestamp = true,
  defaultOpen = true,
  children,
}: {
  label: string;
  content?: string;
  createdAt: string;
  showTimestamp?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="py-1">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center gap-1.5 py-1"
      >
        <View
          style={{
            transform: [{ rotate: open ? "90deg" : "0deg" }],
          }}
        >
          <ChevronRight size={12} color="#d4d4d4" />
        </View>
        <Text className="text-[11px] text-neutral-300 font-bold font-mono">
          {label}
        </Text>
        {showTimestamp && (
          <Text className="text-[10px] text-neutral-600 ml-auto">
            {formatTime(createdAt)}
          </Text>
        )}
      </Pressable>

      {open &&
        (children ?? (
          <View className="bg-neutral-950 border border-neutral-800 rounded-lg mb-1 overflow-hidden">
            <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
              <Text className="text-xs font-mono px-3 py-2 text-green-400/90 leading-5">
                {content}
              </Text>
            </ScrollView>
          </View>
        ))}
    </View>
  );
}
