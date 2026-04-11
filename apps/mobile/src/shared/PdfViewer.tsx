import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { downloadAuthFile } from "../lib/downloadAuthFile";
import { DelayedSpinner } from "./DelayedSpinner";

function NativePdfViewer({ url }: { url: string }) {
  const PdfRendererView = require("react-native-pdf-renderer")
    .default as typeof import("react-native-pdf-renderer").default;

  const { token } = useAuth();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    let cancelled = false;
    setLocalUri(null);
    setError(false);

    downloadAuthFile(url, { token: tokenRef.current, filename: "file.pdf" })
      .then((file) => {
        if (!cancelled) setLocalUri(file.uri);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">Unable to load PDF</Text>
      </View>
    );
  }

  if (!localUri) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <DelayedSpinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <PdfRendererView
        source={localUri}
        distanceBetweenPages={16}
        maxPageResolution={2048}
        style={{ flex: 1, backgroundColor: "transparent" }}
      />
    </View>
  );
}

function WebPdfViewer({ url }: { url: string }) {
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

/**
 * Renders PDFs natively on iOS/Android (PdfKit / PdfRenderer) and
 * falls back to the browser's built-in PDF viewer on web.
 */
export function PdfViewer({ url }: { url: string }) {
  if (Platform.OS === "web") {
    return <WebPdfViewer url={url} />;
  }
  return <NativePdfViewer url={url} />;
}
