import { Cast } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { EmptyState } from "../../../src/shared/EmptyState";
import { TabScrollView } from "../../../src/shared/TabScrollView";

export default function CanvasScreen() {
  const colors = useNavigationTheme();
  // TODO: wire up real discovery via react-native-google-cast (Chromecast)
  // and AVRoutePickerView (AirPlay). Tapping a device will start a session
  // and load the receiver URL from SSM /gremlin/canvas-url.
  return (
    <TabScrollView contentContainerClassName="px-4 pt-3 gap-4 grow">
      <View className="flex-row items-center gap-3 px-1">
        <Cast size={22} color={colors.headerText} />
        <Text className="text-text-primary text-lg font-semibold">
          Cast canvas to a device
        </Text>
      </View>
      <Text className="text-text-secondary text-sm px-1">
        Show a live, agent-driven view on any Chromecast-compatible display.
      </Text>
      <EmptyState
        icon={<ActivityIndicator color={colors.iconMuted} />}
        message="Searching for devices"
        description="Make sure your phone and the display are on the same Wi-Fi network."
      />
    </TabScrollView>
  );
}
