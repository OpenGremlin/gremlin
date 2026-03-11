import { FileText } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Document } from "../graphql/generated/graphql";
import { Markdown } from "./LogEntryView/Markdown";
import { SheetModal } from "./SheetModal";

export function DocumentCard({ doc }: { doc: Document }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
      >
        <View className="flex-row items-center gap-2 px-3 py-2">
          <FileText size={14} color="#818cf8" />
          <Text
            className="text-sm font-medium text-neutral-200 flex-1"
            numberOfLines={1}
          >
            {doc.title}
          </Text>
        </View>
      </Pressable>

      <SheetModal
        visible={open}
        title={doc.title}
        onClose={() => setOpen(false)}
        tall
      >
        <ScrollView className="flex-1 px-4 py-4">
          <Markdown>{doc.body ?? ""}</Markdown>
        </ScrollView>
      </SheetModal>
    </>
  );
}
