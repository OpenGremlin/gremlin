import { Pressable, Text } from "react-native";
import { AgentAvatar } from "../AgentAvatar";

export function ChatHeaderTitle({
  agentId,
  title,
  onPress,
}: {
  agentId: string;
  title: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="items-center">
      <AgentAvatar id={agentId} size={64} />
      <Text
        className="text-sm text-text-primary mt-1.5 font-semibold max-w-[200px] text-center"
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}
