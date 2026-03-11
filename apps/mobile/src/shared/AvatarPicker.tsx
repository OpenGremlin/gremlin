import { X } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AvatarsQuery } from "../graphql/generated/graphql";

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
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-neutral-900 rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <Text className="text-sm font-semibold text-neutral-100">
              Choose Avatar
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#a3a3a3" />
            </Pressable>
          </View>

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
        </View>
      </View>
    </Modal>
  );
}
