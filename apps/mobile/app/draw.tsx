import { useCanvasRef } from "@shopify/react-native-skia";
import { Directory, File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { Send, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteDraft, loadDraft, saveDraft } from "../src/lib/drawingDraft";
import { drawingEvents } from "../src/lib/drawingEvents";
import { DrawingCanvas, type Stroke } from "../src/shared/DrawingCanvas";
import { type DrawingTool, DrawingToolbar } from "../src/shared/DrawingToolbar";

function snapshotCanvas(
  ref: ReturnType<typeof useCanvasRef>,
): { base64: string; uri: string; size: number } | null {
  const image = ref.current?.makeImageSnapshot();
  if (!image) return null;

  const data = image.encodeToBase64();
  if (!data) return null;

  const dir = new Directory(Paths.cache, "drawings");
  if (!dir.exists) dir.create({ intermediates: true });

  const filename = `drawing_${Date.now()}.png`;
  const file = new File(dir, filename);
  file.create();
  file.write(data, { encoding: "base64" });

  return { base64: data, uri: file.uri, size: file.size ?? 0 };
}

export default function DrawScreen() {
  const { agentId, mode } = useLocalSearchParams<{
    agentId: string;
    mode: "new" | "continue";
  }>();
  const insets = useSafeAreaInsets();
  const canvasRef = useCanvasRef();

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("thin");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [sending, setSending] = useState(false);
  // Track whether the user cleared the canvas (so close doesn't preserve a stale draft)
  const cleared = useRef(false);

  // Clean up stale temp drawing files from previous sessions
  useEffect(() => {
    const dir = new Directory(Paths.cache, "drawings");
    if (dir.exists) {
      dir.delete();
      dir.create({ intermediates: true });
    }
  }, []);

  const draftUri = useMemo(() => {
    if (mode === "continue" && agentId) {
      return loadDraft(agentId);
    }
    return null;
  }, [mode, agentId]);

  const hasContent = strokes.length > 0 || draftUri !== null;

  const handleSend = useCallback(() => {
    if (sending) return;
    setSending(true);
    try {
      const result = snapshotCanvas(canvasRef);
      if (!result) return;

      if (agentId) deleteDraft(agentId);

      drawingEvents.emit({
        uri: result.uri,
        name: `drawing_${Date.now()}.png`,
        size: result.size,
        type: "image/png",
      });
      router.back();
    } finally {
      setSending(false);
    }
  }, [canvasRef, agentId, sending]);

  const handleClose = useCallback(() => {
    if (agentId) {
      if (cleared.current && strokes.length === 0) {
        // User cleared everything — remove stale draft
        deleteDraft(agentId);
      } else if (strokes.length > 0) {
        const result = snapshotCanvas(canvasRef);
        if (result) saveDraft(agentId, result.base64);
      }
    }
    router.back();
  }, [canvasRef, agentId, strokes.length]);

  const handleClear = useCallback(() => {
    Alert.alert("Clear Drawing", "This will erase everything.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setStrokes([]);
          cleared.current = true;
        },
      },
    ]);
  }, []);

  const handleUndo = useCallback(() => {
    setStrokes((s) => s.slice(0, -1));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <DrawingCanvas
        draftUri={draftUri}
        canvasRef={canvasRef}
        strokes={strokes}
        setStrokes={setStrokes}
        currentTool={selectedTool}
        currentColor={selectedColor}
      />

      {/* Top bar */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 12,
          right: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={handleClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.06)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={22} color="#374151" />
        </Pressable>

        <Pressable
          onPress={handleSend}
          disabled={!hasContent || sending}
          style={{
            height: 40,
            paddingHorizontal: 20,
            borderRadius: 20,
            backgroundColor: hasContent ? "#3B82F6" : "#D1D5DB",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send size={16} color="white" />
          )}
        </Pressable>
      </View>

      <DrawingToolbar
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        onToolChange={setSelectedTool}
        onColorChange={setSelectedColor}
        onUndo={handleUndo}
        onClear={handleClear}
        canUndo={strokes.length > 0}
      />
    </View>
  );
}
