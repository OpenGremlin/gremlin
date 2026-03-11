import { Modal, Pressable, Text, View } from "react-native";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-black/60 items-center justify-center px-8"
      >
        <Pressable
          onPress={() => {}}
          className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm px-6 py-5"
        >
          <Text className="text-neutral-100 font-semibold text-base mb-1">
            {title}
          </Text>
          <Text className="text-neutral-400 text-sm mb-5">{message}</Text>
          <View className="flex-row justify-end gap-3">
            <Pressable onPress={onCancel} className="px-4 py-2 rounded-lg">
              <Text className="text-neutral-400 font-medium">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`px-4 py-2 rounded-lg ${destructive ? "bg-red-600" : "bg-blue-600"}`}
            >
              <Text className="text-white font-medium">{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
