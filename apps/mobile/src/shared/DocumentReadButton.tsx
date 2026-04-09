import { Loader2, Pause, Play, Volume2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useDocumentReader } from "../hooks/useDocumentReader";
import { useTheme } from "../lib/ThemeContext";
import { useVoice } from "../lib/VoiceContext";
import { AgentAvatar } from "./AgentAvatar";

const AVATAR_SIZE = 48;
const CARD_RADIUS = 12;
const CARD_INNER_RADIUS = CARD_RADIUS - 1;

/**
 * "Read aloud" card for document previews. DelegateCard-style treatment
 * with the reader agent's avatar flush-left and a play/pause CTA.
 */
export function DocumentReadButton({ markdown }: { markdown: string }) {
  const { reader, available, loading, play, pickReader } = useDocumentReader();
  const { playing, paused, pause, resume } = useVoice();
  const { isDark } = useTheme();

  if (!available || !reader) return null;

  const accentColor = isDark ? "#818cf8" : "#6366f1";

  const handlePress = () => {
    if (loading) return;
    if (playing) {
      pause();
    } else if (paused) {
      resume();
    } else {
      play(markdown);
    }
  };

  const icon = loading ? (
    <Loader2 size={16} color={accentColor} />
  ) : playing ? (
    <Pause size={16} color={accentColor} />
  ) : paused ? (
    <Play size={16} color={accentColor} />
  ) : (
    <Volume2 size={16} color={accentColor} />
  );

  const label = loading
    ? "Loading..."
    : playing
      ? "Playing..."
      : paused
        ? "Paused"
        : "Read aloud";

  return (
    <View className="mt-2 mb-2">
      <Pressable
        onPress={handlePress}
        style={{
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: isDark ? "rgba(129, 140, 248, 0.25)" : "#c7d2fe",
          backgroundColor: isDark ? "#1e1b4b" : "#eef2ff",
          overflow: "hidden",
        }}
      >
        <View
          className="flex-row items-stretch"
          style={{ minHeight: AVATAR_SIZE }}
        >
          <Pressable onPress={pickReader}>
            <AgentAvatar
              id={reader.id}
              size={AVATAR_SIZE}
              cornerStyle={{
                borderTopLeftRadius: CARD_INNER_RADIUS,
                borderBottomLeftRadius: CARD_INNER_RADIUS,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              hideManagerBadge
            />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2 px-3">
            {icon}
            <Text
              className="text-sm font-medium flex-1"
              style={{ color: isDark ? "#c7d2fe" : "#4338ca" }}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text className="text-xs text-text-muted" numberOfLines={1}>
              {reader.name}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
