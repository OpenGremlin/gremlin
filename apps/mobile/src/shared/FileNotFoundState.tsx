import { router } from "expo-router";
import { View } from "react-native";
import { EmptyState } from "./EmptyState";

export function FileNotFoundState({ fileName }: { fileName: string }) {
  // Dismiss the file sheet before navigating — otherwise the sheet stays
  // stuck behind the new screen.
  const handleSearch = () => {
    router.dismiss();
    setTimeout(() => {
      router.push(`/files?q=${encodeURIComponent(fileName)}`);
    }, 0);
  };

  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <EmptyState
        message="File Not Found"
        description="It may have been moved or deleted."
        actionLabel={fileName ? "Search" : undefined}
        onAction={fileName ? handleSearch : undefined}
      />
    </View>
  );
}
