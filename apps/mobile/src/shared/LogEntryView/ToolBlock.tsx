import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { formatTime } from "../formatDate";

const COLLAPSED_MAX_HEIGHT = 100;

function CollapsedContent({
  content,
  streaming,
  onExpand,
  children,
}: {
  content?: string;
  streaming?: boolean;
  onExpand: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onExpand}
      className="bg-neutral-950 border border-neutral-800 rounded-lg mb-1 overflow-hidden"
    >
      <View style={{ maxHeight: COLLAPSED_MAX_HEIGHT, overflow: "hidden" }}>
        <Text className="text-xs font-mono px-3 py-2 text-green-400/90 leading-5">
          {content}
        </Text>
      </View>
      <LinearGradient
        colors={["transparent", "rgba(10,10,10,0.9)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 32,
        }}
        pointerEvents="none"
      />
      {streaming && children}
    </Pressable>
  );
}

function ExpandedContent({
  content,
  streaming,
  onCollapse,
  children,
}: {
  content?: string;
  streaming?: boolean;
  onCollapse: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onCollapse}
      className="bg-neutral-950 border border-neutral-800 rounded-lg mb-1 overflow-hidden"
    >
      <Text className="text-xs font-mono px-3 py-2 text-green-400/90 leading-5">
        {content}
      </Text>
      {streaming && children}
    </Pressable>
  );
}

export function ToolBlock({
  label,
  content,
  createdAt,
  showTimestamp = true,
  defaultOpen = true,
  streaming,
  children,
}: {
  label: string;
  content?: string;
  createdAt: string;
  showTimestamp?: boolean;
  defaultOpen?: boolean;
  /** When true, renders content block AND children (for streaming footer). */
  streaming?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  const contentBlock =
    streaming || !children ? (
      expanded ? (
        <ExpandedContent
          content={content}
          streaming={streaming}
          onCollapse={() => setExpanded(false)}
        >
          {children}
        </ExpandedContent>
      ) : (
        <CollapsedContent
          content={content}
          streaming={streaming}
          onExpand={() => setExpanded(true)}
        >
          {children}
        </CollapsedContent>
      )
    ) : (
      children
    );

  return (
    <View className="py-2 mr-10">
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
        <Text
          className="text-[11px] text-neutral-300 font-bold font-mono flex-shrink"
          numberOfLines={1}
        >
          {label}
        </Text>
        {showTimestamp && (
          <Text className="text-[10px] text-neutral-600">
            {formatTime(createdAt)}
          </Text>
        )}
      </Pressable>

      {open && contentBlock}
    </View>
  );
}
