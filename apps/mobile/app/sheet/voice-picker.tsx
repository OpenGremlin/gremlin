import { router, useLocalSearchParams } from "expo-router";
import { Check, Volume2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SpeechVoicesQuery } from "../../src/graphql/queries";
import { execute } from "../../src/lib/apolloClient";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { Sheet } from "../../src/shared/Sheet";

export interface VoicePickerSheetPayload {
  providerId: string | undefined;
  currentVoice: string | null | undefined;
  onSelect: (voice: string) => void;
}

type Voice = { id: string; name: string; description?: string | null };

export default function VoicePickerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<VoicePickerSheetPayload>(id);
  const colors = useNavigationTheme();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  useEffect(() => {
    if (!payload?.providerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    execute(SpeechVoicesQuery, { providerId: payload.providerId }).then(
      (result) => {
        if (cancelled) return;
        setVoices(result.speechVoices);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [payload?.providerId]);

  if (!payload) return null;

  return (
    <Sheet title="Choose Voice">
      {loading ? (
        <View className="py-8 items-center">
          <Text className="text-sm text-text-muted">Loading voices...</Text>
        </View>
      ) : (
        <FlatList
          data={voices}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-3"
          renderItem={({ item }) => {
            const selected = payload.currentVoice === item.id;
            return (
              <Pressable
                onPress={() => {
                  payload.onSelect(item.id);
                  router.back();
                }}
                className={`flex-row items-center gap-3 px-3 py-3 rounded-lg ${
                  selected ? "bg-surface-alt" : "active:bg-surface-alt"
                }`}
              >
                <Volume2
                  size={16}
                  color={selected ? colors.headerText : colors.iconDefault}
                />
                <View className="flex-1">
                  <Text
                    className={`text-sm ${selected ? "text-text-primary font-medium" : "text-text-secondary"}`}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text className="text-xs text-text-muted" numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
                {selected && <Check size={16} color={colors.headerText} />}
              </Pressable>
            );
          }}
        />
      )}
    </Sheet>
  );
}
