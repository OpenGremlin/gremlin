import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AvatarsQuery } from "../../graphql/generated/graphql";
import { useNavigationTheme } from "../../lib/useNavigationTheme";

export type Avatar = AvatarsQuery["avatars"][number];

/** Pure layout body for the avatar-picker sheet route. */
export function AvatarPickerContent({
  avatars,
  loading,
  onSelect,
}: {
  avatars: Avatar[];
  loading: boolean;
  onSelect: (avatar: Avatar) => void;
}) {
  const colors = useNavigationTheme();

  if (loading) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color={colors.iconDefault} />
      </View>
    );
  }

  return (
    <FlatList
      data={avatars}
      keyExtractor={(item) => item.id}
      numColumns={4}
      contentContainerClassName="p-3"
      columnWrapperClassName="gap-2 mb-2"
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          className="flex-1 items-center gap-1 p-2 rounded-xl active:bg-surface-alt"
        >
          <View className="w-16 h-16 rounded-full overflow-hidden bg-surface-alt">
            <Image
              source={{ uri: item.url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text
            className="text-[10px] text-text-muted text-center"
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
    />
  );
}
