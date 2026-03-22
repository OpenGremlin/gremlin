import { ScrollView } from "react-native";
import { MobileQrCode } from "../../../src/shared/MobileQrCode";

export default function ConnectMobileScreen() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6">
      <MobileQrCode />
    </ScrollView>
  );
}
