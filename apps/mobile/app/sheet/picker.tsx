import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, type TextInput, View } from "react-native";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { Input } from "../../src/shared/Input";
import type { PickerSheetPayload } from "../../src/shared/PickerModal";
import { Sheet } from "../../src/shared/Sheet";

export default function PickerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<PickerSheetPayload>(id);
  const colors = useNavigationTheme();
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  const filtered = useMemo(() => {
    if (!payload) return [];
    if (!search) return payload.options;
    const lower = search.toLowerCase();
    return payload.options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        o.subtitle?.toLowerCase().includes(lower) ||
        o.searchTerms?.toLowerCase().includes(lower),
    );
  }, [payload, search]);

  if (!payload) return null;

  return (
    <Sheet title={payload.title}>
      {payload.searchable && (
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
              payload.onSelect(item.value);
              router.back();
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
            {item.value === payload.selected && (
              <Check size={18} color={colors.accentIndicator} />
            )}
          </Pressable>
        )}
      />
    </Sheet>
  );
}
