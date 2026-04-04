import { Volume2, VolumeOff } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSpeechAvailable } from "../hooks/useSpeechAvailable";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { useVoiceModeContext } from "../lib/VoiceModeContext";

export function VoiceModeButton({ agentId }: { agentId: string }) {
  const colors = useNavigationTheme();
  const speechAvailable = useSpeechAvailable(agentId);
  const { voiceEnabled, toggleVoice } = useVoiceModeContext();

  if (!speechAvailable) return null;

  return (
    <Pressable onPress={toggleVoice}>
      {voiceEnabled ? (
        <Volume2 size={22} color={colors.accentIndicator} />
      ) : (
        <VolumeOff size={22} color={colors.headerText} />
      )}
    </Pressable>
  );
}
