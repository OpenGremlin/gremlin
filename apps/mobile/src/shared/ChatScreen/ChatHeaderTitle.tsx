import { Pressable, Text, View } from "react-native";
import { agentNameColor, hexWithAlpha } from "../../lib/color";
import { useTheme } from "../../lib/ThemeContext";
import { darkVars, lightVars } from "../../lib/themeVars";
import { AgentAvatar } from "../AgentAvatar";

// The surface-alt CSS variable at 80% alpha — NativeWind's /80 modifier
// doesn't resolve through var(), so we read the raw tokens here.
const PILL_BG_LIGHT = hexWithAlpha(lightVars["--color-surface-alt"], 0.8);
const PILL_BG_DARK = hexWithAlpha(darkVars["--color-surface-alt"], 0.8);

export function ChatHeaderTitle({
  agentId,
  title,
  titleHexColor,
  onPress,
}: {
  agentId: string;
  title: string;
  titleHexColor?: string | null;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="items-center">
      <View style={{ zIndex: 1, elevation: 1 }}>
        <AgentAvatar id={agentId} size={64} />
      </View>
      <View
        className="px-5 py-2 rounded-full max-w-[240px]"
        style={{
          marginTop: -6,
          backgroundColor: isDark ? PILL_BG_DARK : PILL_BG_LIGHT,
        }}
      >
        <Text
          className="text-sm font-bold text-center"
          style={{ color: agentNameColor(titleHexColor) }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
