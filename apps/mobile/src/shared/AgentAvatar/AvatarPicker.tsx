import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AvatarsQuery } from "../../graphql/generated/graphql";
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
  return (
    <SheetModal visible title="Choose Avatar" onClose={onClose}>
      {loading ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#a3a3a3" />
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
              className="flex-1 items-center gap-1 p-2 rounded-xl active:bg-neutral-800"
            >
              <View className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800">
                <Image
                  source={{ uri: item.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text
                className="text-[10px] text-neutral-400 text-center"
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
