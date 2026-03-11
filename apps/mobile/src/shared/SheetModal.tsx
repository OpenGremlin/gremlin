import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-neutral-900 rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <Text className="text-sm font-semibold text-neutral-100">
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#a3a3a3" />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
