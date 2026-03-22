import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, type TextInput, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { Input } from "./Input";
import { SheetModal } from "./SheetModal";

export interface PickerOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Extra text to match against when searching (not displayed) */
  searchTerms?: string;
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
  const searchRef = useRef<TextInput>(null);
  const colors = useNavigationTheme();

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        o.subtitle?.toLowerCase().includes(lower) ||
        o.searchTerms?.toLowerCase().includes(lower),
    );
  }, [options, search]);

  return (
    <SheetModal visible={visible} title={title} onClose={onClose}>
      {searchable && (
        <View className="px-4 py-2 border-b border-app-border">
          <Input
            ref={searchRef}
            className="bg-surface-alt border-0"
            placeholder="Search..."
            value={search}
            onLayout={() => setTimeout(() => searchRef.current?.focus(), 300)}
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
            className="flex-row items-center justify-between px-4 py-3 active:bg-surface-alt"
          >
            <View className="flex-1 flex-row items-center gap-3">
              {item.icon}
              <Text className="text-sm text-text-primary">{item.label}</Text>
              {item.subtitle && (
                <Text className="text-xs text-text-muted">{item.subtitle}</Text>
              )}
            </View>
            {item.value === selected && (
              <Check size={18} color={colors.accentIndicator} />
            )}
          </Pressable>
        )}
      />
    </SheetModal>
  );
}
