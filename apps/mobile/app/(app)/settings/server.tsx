import { router } from "expo-router";
import { Unplug } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { clearToken } from "../../../src/lib/auth";
import { clearServerConfig } from "../../../src/lib/config";
import { useServerConfig } from "../../../src/lib/ServerConfigContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Card } from "../../../src/shared/Card";

export default function ServerScreen() {
  const colors = useNavigationTheme();
  const { config } = useServerConfig();

  const handleDisconnect = async () => {
    await clearToken();
    await clearServerConfig();
    router.replace("/connect");
  };

  return (
    <View className="flex-1 px-4 py-4 gap-6">
      <Card className="overflow-hidden px-4 py-3.5 gap-1">
        <Text className="text-xs text-text-muted">Server URL</Text>
        <Text className="text-base text-text-primary font-mono">
          {config?.serverUrl}
        </Text>
      </Card>

      <Card className="overflow-hidden px-4 py-3.5 gap-1">
        <Text className="text-xs text-text-muted">Cognito Domain</Text>
        <Text className="text-base text-text-primary font-mono">
          {config?.cognitoDomain}
        </Text>
      </Card>

      <Pressable
        onPress={handleDisconnect}
        className="flex-row items-center justify-center gap-2 py-3.5 rounded-lg border border-warning-border bg-warning-surface active:opacity-70"
      >
        <Unplug size={18} color={colors.warning} />
        <Text className="text-base font-medium text-warning">Disconnect</Text>
      </Pressable>
    </View>
  );
}
