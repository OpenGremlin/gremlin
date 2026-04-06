import { View } from "react-native";

import { Markdown } from "../LogEntryView/Markdown";

export function UserBubble({
  content,
  pending,
}: {
  content: string;
  pending?: boolean;
}) {
  return (
    <View className="flex-row justify-end">
      <View
        className={`max-w-[80%] rounded-2xl rounded-br-md px-3.5 pt-2 pb-0.5 ${
          pending
            ? "bg-user-bubble/40 border border-accent-border"
            : "bg-user-bubble"
        }`}
      >
        <Markdown variant="user">{content}</Markdown>
      </View>
    </View>
  );
}
