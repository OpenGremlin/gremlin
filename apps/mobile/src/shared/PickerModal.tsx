import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, type TextInput, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { BottomSheet } from "./BottomSheet";
import { Input } from "./Input";

export interface PickerOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Extra text to match against when searching (not displayed) */
  searchTerms?: string;
}

export interface PickerPayload {
  title: string;
  options: PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}

// ---------------------------------------------------------------------------
// Singleton ref for imperative presentPicker() calls
// ---------------------------------------------------------------------------

let showFn: ((payload: PickerPayload) => void) | null = null;

/**
 * Open the generic picker with the given options. The onSelect callback
 * fires when the user taps a row, and the picker dismisses itself.
 */
export function presentPicker(payload: PickerPayload): void {
  showFn?.(payload);
}

/**
 * Render this once near the app root (e.g. inside RootLayout) so that
 * presentPicker() has a target to display in.
 */
export function PickerOverlay() {
  const [payload, setPayload] = useState<PickerPayload | null>(null);
  const colors = useNavigationTheme();
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  // Register the imperative show function
  showFn = useCallback((p: PickerPayload) => {
    setSearch("");
    setPayload(p);
  }, []);

  const dismiss = useCallback(() => setPayload(null), []);

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

  return (
    <BottomSheet
      visible={!!payload}
      title={payload?.title ?? ""}
      onDismiss={dismiss}
    >
      {payload?.searchable && (
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
              payload?.onSelect(item.value);
              dismiss();
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
            {item.value === payload?.selected && (
              <Check size={18} color={colors.accentIndicator} />
            )}
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}
