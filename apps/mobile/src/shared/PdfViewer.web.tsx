import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { DelayedSpinner } from "./DelayedSpinner";

export function PdfViewer({ url }: { url: string }) {
  const { token } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBlobUrl(null);
    setError(false);

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [url, token]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">Unable to load PDF</Text>
      </View>
    );
  }

  if (!blobUrl) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <DelayedSpinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <iframe
        src={blobUrl}
        style={{ flex: 1, border: "none" }}
        title="PDF preview"
      />
    </View>
  );
}
