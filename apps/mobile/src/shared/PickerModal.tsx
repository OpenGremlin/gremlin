import { Check, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface PickerOption {
  value: string;
  label: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
}

export function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  searchable,
}: PickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

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

          {searchable && (
            <View className="px-4 py-2 border-b border-neutral-800">
              <TextInput
                className="bg-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100"
                placeholder="Search..."
                placeholderTextColor="#737373"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                  setSearch("");
                }}
                className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-800"
              >
                <Text className="text-sm text-neutral-100 flex-1">
                  {item.label}
                </Text>
                {item.value === selected && <Check size={18} color="#818cf8" />}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
