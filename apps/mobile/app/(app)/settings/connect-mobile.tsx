import { MobileQrCode } from "../../../src/shared/MobileQrCode";
import { TabScrollView } from "../../../src/shared/TabScrollView";

export default function ConnectMobileScreen() {
  return (
    <TabScrollView contentContainerClassName="px-4 pt-6">
      <MobileQrCode />
    </TabScrollView>
  );
}
