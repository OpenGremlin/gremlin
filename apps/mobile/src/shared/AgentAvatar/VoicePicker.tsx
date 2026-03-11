import { Check, Volume2, X } from "lucide-react-native";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

const INWORLD_VOICES = [
  "Alex",
  "Arjun",
  "Ashley",
  "Blake",
  "Carter",
  "Clive",
  "Dennis",
  "Dominus",
  "Edward",
  "Ethan",
  "Evelyn",
  "Graham",
  "Hades",
  "Hana",
  "Hank",
  "Jason",
  "Julia",
  "Kayla",
  "Lauren",
  "Nate",
  "Oliver",
  "Olivia",
  "Priya",
  "Ronald",
  "Shaun",
  "Simon",
  "Snik",
  "Theodore",
  "Victor",
  "Victoria",
  "Vinny",
] as const;

type VoiceItem = { key: string; voice: string | null };

const DATA: VoiceItem[] = [
  { key: "__none__", voice: null },
  ...INWORLD_VOICES.map((v) => ({ key: v, voice: v as string | null })),
];

export function VoicePicker({
  currentVoice,
  onSelect,
  onClose,
}: {
  currentVoice: string | null | undefined;
  onSelect: (voice: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-neutral-900 rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <Text className="text-sm font-semibold text-neutral-100">
              Choose Voice
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#a3a3a3" />
            </Pressable>
          </View>

          <FlatList
            data={DATA}
            keyExtractor={(item) => item.key}
            numColumns={3}
            contentContainerClassName="p-3"
            columnWrapperClassName="gap-2 mb-2"
            renderItem={({ item }) => {
              const selected = item.voice
                ? currentVoice === item.voice
                : !currentVoice;
              return (
                <Pressable
                  onPress={() => onSelect(item.voice)}
                  className={`flex-1 flex-row items-center gap-2 px-3 py-2.5 rounded-lg ${
                    selected ? "bg-neutral-700" : "active:bg-neutral-800"
                  }`}
                >
                  {item.voice ? (
                    <Volume2
                      size={14}
                      color={selected ? "#f5f5f5" : "#a3a3a3"}
                    />
                  ) : null}
                  <Text
                    className={`text-sm ${selected ? "text-neutral-100" : "text-neutral-400"}`}
                    numberOfLines={1}
                  >
                    {item.voice ?? "None"}
                  </Text>
                  {selected && (
                    <Check
                      size={14}
                      color="#f5f5f5"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
