import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownFromLine, ChevronRight } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { formatTime } from "../formatDate";

const COLLAPSED_MAX_HEIGHT = 150;

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
  const [overflows, setOverflows] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      setScrolledDown(contentOffset.y > 2);
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      setShowBottomFade(distanceFromBottom > 2);
    },
    [],
  );

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    setOverflows(h > COLLAPSED_MAX_HEIGHT + 2);
  }, []);

  return (
    <View className="bg-neutral-950 border border-neutral-800 rounded-lg mb-1 overflow-hidden">
      <ScrollView
        style={{ maxHeight: COLLAPSED_MAX_HEIGHT }}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
      >
        <Text className="text-xs font-mono px-3 py-2 text-green-400/90 leading-5">
          {content}
        </Text>
      </ScrollView>
      {overflows && (
        <Pressable
          onPress={onExpand}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 2,
            padding: 2,
          }}
        >
          <ArrowDownFromLine size={14} color="#737373" />
        </Pressable>
      )}
      {scrolledDown && (
        <LinearGradient
          colors={["rgba(10,10,10,0.8)", "transparent"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 16,
          }}
          pointerEvents="none"
        />
      )}
      {showBottomFade && (
        <LinearGradient
          colors={["transparent", "rgba(10,10,10,0.8)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 16,
          }}
          pointerEvents="none"
        />
      )}
      {streaming && children}
    </View>
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
        <Text
          className="text-[11px] text-neutral-300 font-bold font-mono flex-shrink"
          numberOfLines={1}
        >
          {label}
        </Text>
        {showTimestamp && (
          <Text className="text-[10px] text-neutral-600 ml-auto">
            {formatTime(createdAt)}
          </Text>
        )}
      </Pressable>

      {open && contentBlock}
    </View>
  );
}
