import { Volume2, VolumeOff } from "lucide-react-native";
import { Pressable } from "react-native";
import { useSpeechAvailable } from "../hooks/useSpeechAvailable";
import { haptics } from "../lib/haptics";
import { useLocalSettings } from "../lib/LocalSettingsContext";
import { useNavigationTheme } from "../lib/useNavigationTheme";

export function VoiceModeButton({ agentId }: { agentId: string }) {
  const colors = useNavigationTheme();
  const speechAvailable = useSpeechAvailable(agentId);
  const { voiceEnabled, toggleVoice } = useLocalSettings();

  if (!speechAvailable) return null;

  const handlePress = () => {
    haptics.light();
    toggleVoice();
  };

  return (
    <Pressable onPress={handlePress} style={{ padding: 8 }}>
      {voiceEnabled ? (
        <Volume2 size={22} color={colors.accentIndicator} />
      ) : (
        <VolumeOff size={22} color={colors.headerText} />
      )}
    </Pressable>
  );
}
