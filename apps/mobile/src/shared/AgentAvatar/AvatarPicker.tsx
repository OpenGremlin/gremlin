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
import { SheetModal } from "../SheetModal";

type Avatar = AvatarsQuery["avatars"][number];

export function AvatarPicker({
  avatars,
  loading,
  onSelect,
  onClose,
}: {
  avatars: Avatar[];
  loading: boolean;
  onSelect: (avatar: Avatar) => void;
  onClose: () => void;
}) {
  const colors = useNavigationTheme();
  return (
    <SheetModal visible title="Choose Avatar" onClose={onClose}>
      {loading ? (
        <View className="py-12 items-center">
          <ActivityIndicator color={colors.iconDefault} />
        </View>
      ) : (
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
      )}
    </SheetModal>
  );
}
