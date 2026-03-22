import { Text, View } from "react-native";
import QRCode from "react-qr-code";
import { buildConnectUrl } from "../lib/connectUtils";

export function MobileQrCode() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!origin) return null;

  const qrValue = buildConnectUrl(origin);

  return (
    <View className="rounded-xl border border-app-border bg-surface p-4 items-center gap-4">
      <Text className="text-xs text-text-muted self-start">
        Scan this QR code with the Gremlin mobile app to connect it to this
        server.
      </Text>
      <View className="bg-white p-4 rounded-xl">
        <QRCode value={qrValue} size={200} />
      </View>
      <Text
        className="text-xs text-text-faint text-center font-mono"
        selectable
      >
        {origin}
      </Text>
    </View>
  );
}
