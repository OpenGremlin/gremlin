import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../lib/ThemeContext";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { formatTime } from "../formatDate";

const COLLAPSED_MAX_HEIGHT = 100;

const darkCodeBg = "#0a0a0a";
const darkCodeText = "rgba(74,222,128,0.9)";
const darkCodeFade = "rgba(10,10,10,0.9)";
const darkCodeFadeTransparent = "rgba(10,10,10,0)";
const lightCodeBg = "#e4e4e4";
const lightCodeText = "#b45309";
const lightCodeFade = "rgba(228,228,228,0.9)";
const lightCodeFadeTransparent = "rgba(228,228,228,0)";

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
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onExpand}
      className="rounded-lg mb-1 overflow-hidden"
      style={{ backgroundColor: isDark ? darkCodeBg : lightCodeBg }}
    >
      <View style={{ maxHeight: COLLAPSED_MAX_HEIGHT, overflow: "hidden" }}>
        <Text
          className="text-sm font-mono px-3 py-2 leading-5"
          style={{ color: isDark ? darkCodeText : lightCodeText }}
        >
          {content}
        </Text>
      </View>
      <LinearGradient
        colors={[
          isDark ? darkCodeFadeTransparent : lightCodeFadeTransparent,
          isDark ? darkCodeFade : lightCodeFade,
        ]}
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
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onCollapse}
      className="rounded-lg mb-1 overflow-hidden"
      style={{ backgroundColor: isDark ? darkCodeBg : lightCodeBg }}
    >
      <Text
        className="text-sm font-mono px-3 py-2 leading-5"
        style={{ color: isDark ? darkCodeText : lightCodeText }}
      >
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
  label: React.ReactNode;
  content?: string;
  createdAt: string;
  showTimestamp?: boolean;
  defaultOpen?: boolean;
  /** When true, renders content block AND children (for streaming footer). */
  streaming?: boolean;
  children?: React.ReactNode;
}) {
  const colors = useNavigationTheme();
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: withTiming(open ? "90deg" : "0deg", { duration: 200 }) },
    ],
  }));

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
        <Animated.View style={chevronStyle}>
          <ChevronRight size={14} color={colors.headerText} />
        </Animated.View>
        {typeof label === "string" ? (
          <Text
            className="text-sm text-text-secondary font-bold font-mono flex-shrink"
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : (
          <View className="flex-row items-center flex-shrink">{label}</View>
        )}
        {showTimestamp && (
          <Text className="text-[10px] text-text-faint">
            {formatTime(createdAt)}
          </Text>
        )}
      </Pressable>

      {open && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          {contentBlock}
        </Animated.View>
      )}
    </View>
  );
}
