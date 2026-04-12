import * as Clipboard from "expo-clipboard";
import { useCallback } from "react";
import { ActionSheetIOS, Platform, Pressable, View } from "react-native";

import { haptics } from "../../lib/haptics";
import { Markdown } from "../LogEntryView/Markdown";

export function UserBubble({
  content,
  pending,
}: {
  content: string;
  pending?: boolean;
}) {
  const handleLongPress = useCallback(() => {
    haptics.medium();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Copy", "Cancel"], cancelButtonIndex: 1 },
        (index: number) => {
          if (index === 0) Clipboard.setStringAsync(content);
        },
      );
    } else {
      Clipboard.setStringAsync(content);
    }
  }, [content]);

  return (
    <View className="flex-row justify-end">
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        className={`max-w-[80%] rounded-2xl rounded-br-md px-3.5 pt-2 pb-0.5 ${
          pending
            ? "bg-user-bubble/40 border border-accent-border"
            : "bg-user-bubble"
        }`}
      >
        <Markdown variant="user">{content}</Markdown>
      </Pressable>
    </View>
  );
}
