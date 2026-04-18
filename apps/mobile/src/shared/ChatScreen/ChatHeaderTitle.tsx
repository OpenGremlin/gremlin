import { Pressable, Text } from "react-native";
import { agentNameColor } from "../../lib/color";
import { AgentAvatar } from "../AgentAvatar";

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
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="items-center">
      <AgentAvatar id={agentId} size={64} />
      <Text
        className="text-sm mt-1.5 font-semibold max-w-[200px] text-center"
        style={{ color: agentNameColor(titleHexColor) }}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}
