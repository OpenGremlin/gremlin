import { router } from "expo-router";
import { FileText } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { Document } from "../graphql/generated/graphql";
import { openSheet } from "../lib/sheetStore";
import { useNavigationTheme } from "../lib/useNavigationTheme";

/** Payload type stored in sheetStore for the document sheet route. */
export interface DocumentSheetPayload {
  title: string;
  body: string;
}

export function DocumentCard({ doc }: { doc: Document }) {
  const colors = useNavigationTheme();

  const handlePress = () => {
    const sheetId = openSheet<DocumentSheetPayload>({
      title: doc.title,
      body: doc.body ?? "",
    });
    router.push(`/sheet/document?id=${sheetId}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-surface border border-app-border rounded-lg overflow-hidden"
    >
      <View className="flex-row items-center gap-2 px-3 py-2">
        <FileText size={14} color={colors.accentIndicator} />
        <Text
          className="text-sm font-medium text-text-secondary flex-1"
          numberOfLines={1}
        >
          {doc.title}
        </Text>
      </View>
    </Pressable>
  );
}
