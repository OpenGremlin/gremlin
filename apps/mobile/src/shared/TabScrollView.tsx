import type { ComponentProps } from "react";
import { ScrollView } from "react-native";

const isWeb = process.env.EXPO_OS === "web";
const TAB_BAR_PADDING = isWeb ? "" : "pb-28";

type Props = ComponentProps<typeof ScrollView> & {
  contentContainerClassName?: string;
};

export function TabScrollView({ contentContainerClassName, ...props }: Props) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1"
      contentContainerClassName={
        contentContainerClassName
          ? `${contentContainerClassName} ${TAB_BAR_PADDING}`
          : TAB_BAR_PADDING
      }
      {...props}
    />
  );
}
