import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// Stack of show handlers — the topmost overlay wins so that pickers
// presented inside a native modal (formSheet) appear above it.
// ---------------------------------------------------------------------------

const showFnStack: Array<(payload: PickerPayload) => void> = [];

/**
 * Open the generic picker with the given options. The onSelect callback
 * fires when the user taps a row, and the picker dismisses itself.
 */
export function presentPicker(payload: PickerPayload): void {
  const fn = showFnStack[showFnStack.length - 1];
  fn?.(payload);
}

/**
 * Render this near the app root **and** inside any native modal (e.g.
 * formSheet routes) so that presentPicker() always appears on top.
 * Each instance registers itself on a stack; the topmost wins.
 */
export function PickerOverlay() {
  const [payload, setPayload] = useState<PickerPayload | null>(null);
  const colors = useNavigationTheme();
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  // Register on the stack; last-mounted overlay (i.e. the one inside
  // the topmost native modal) will be the one that receives calls.
  const showRef = useRef((p: PickerPayload) => {
    setSearch("");
    setPayload(p);
  });
  useEffect(() => {
    const fn = showRef.current;
    showFnStack.push(fn);
    return () => {
      const idx = showFnStack.indexOf(fn);
      if (idx >= 0) showFnStack.splice(idx, 1);
    };
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
