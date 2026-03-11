import { FileText, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { Document } from "../../graphql/generated/graphql";
import { Markdown } from "./Markdown";

function DocumentModal({
  doc,
  onClose,
}: {
  doc: Document;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-neutral-800">
          <Text
            className="flex-1 text-base font-semibold text-neutral-100"
            numberOfLines={1}
          >
            {doc.title}
          </Text>
          <Pressable onPress={onClose} className="p-1">
            <X size={20} color="#a3a3a3" />
          </Pressable>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 px-4 py-4">
          <Markdown>{doc.body ?? ""}</Markdown>
        </ScrollView>
      </View>
    </Modal>
  );
}

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

      {open && <DocumentModal doc={doc} onClose={() => setOpen(false)} />}
    </>
  );
}
