import { View } from "react-native";

import { UserBubble } from "./UserBubble";

export function PendingMessageBubble({ content }: { content: string }) {
  return (
    <View className="py-2">
      <UserBubble content={content} pending />
    </View>
  );
}
