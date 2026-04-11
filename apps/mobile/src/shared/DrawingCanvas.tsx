import {
  BlurMask,
  Canvas,
  Path,
  Rect,
  Skia,
  Image as SkiaImage,
  type SkPath,
  type useCanvasRef,
  useImage,
} from "@shopify/react-native-skia";
import { useCallback, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import type { DrawingTool } from "./DrawingToolbar";

interface Stroke {
  path: SkPath;
  color: string;
  tool: DrawingTool;
}

interface DrawingCanvasProps {
  draftUri?: string | null;
  canvasRef: ReturnType<typeof useCanvasRef>;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  currentTool: DrawingTool;
  currentColor: string;
}

function getStrokeWidth(tool: DrawingTool): number {
  switch (tool) {
    case "thin":
      return 3;
    case "thick":
      return 16;
    case "eraser":
      return 24;
  }
}

export type { Stroke };

export function DrawingCanvas({
  draftUri,
  canvasRef,
  strokes,
  setStrokes,
  currentTool,
  currentColor,
}: DrawingCanvasProps) {
  const { width, height } = useWindowDimensions();
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const draftImage = useImage(draftUri ?? null);

  // Refs to access current tool/color in gesture callbacks without re-creating gesture
  const toolRef = useRef(currentTool);
  toolRef.current = currentTool;
  const colorRef = useRef(currentColor);
  colorRef.current = currentColor;
  // Ref to capture the in-progress path so endStroke can read it without
  // nesting setState calls (which triggers "update while rendering" warnings).
  const currentPathRef = useRef<SkPath | null>(null);

  const beginStroke = useCallback((x: number, y: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x, y);
    currentPathRef.current = path;
    setCurrentPath(path);
  }, []);

  const updateStroke = useCallback((x: number, y: number) => {
    setCurrentPath((prev) => {
      if (!prev) return prev;
      const next = prev.copy();
      next.lineTo(x, y);
      currentPathRef.current = next;
      return next;
    });
  }, []);

  const endStroke = useCallback(() => {
    const path = currentPathRef.current;
    if (path) {
      setStrokes((s) => [
        ...s,
        { path, color: colorRef.current, tool: toolRef.current },
      ]);
    }
    currentPathRef.current = null;
    setCurrentPath(null);
  }, [setStrokes]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(beginStroke)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(updateStroke)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(endStroke)();
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps -- only uses module-level getStrokeWidth
  const renderStroke = useCallback((stroke: Stroke, index: number) => {
    const sw = getStrokeWidth(stroke.tool);
    if (stroke.tool === "eraser") {
      return (
        <Path
          key={index}
          path={stroke.path}
          style="stroke"
          strokeWidth={sw}
          strokeCap="round"
          strokeJoin="round"
          color="white"
          blendMode="srcOver" // draws white over content
        />
      );
    }
    return (
      <Path
        key={index}
        path={stroke.path}
        style="stroke"
        strokeWidth={sw}
        strokeCap="round"
        strokeJoin="round"
        color={stroke.color}
      >
        {stroke.tool === "thick" && <BlurMask style="normal" blur={2} />}
      </Path>
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={pan}>
        <Canvas ref={canvasRef} style={{ width, height }}>
          {/* White background */}
          <Rect x={0} y={0} width={width} height={height} color="white" />

          {/* Draft image layer */}
          {draftImage && (
            <SkiaImage
              image={draftImage}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="fill"
            />
          )}

          {/* Completed strokes */}
          {strokes.map(renderStroke)}

          {/* Current stroke in progress */}
          {currentPath && currentTool === "eraser" && (
            <Path
              path={currentPath}
              style="stroke"
              strokeWidth={getStrokeWidth("eraser")}
              strokeCap="round"
              strokeJoin="round"
              color="white"
              blendMode="srcOver"
            />
          )}
          {currentPath && currentTool !== "eraser" && (
            <Path
              path={currentPath}
              style="stroke"
              strokeWidth={getStrokeWidth(currentTool)}
              strokeCap="round"
              strokeJoin="round"
              color={currentColor}
            >
              {currentTool === "thick" && <BlurMask style="normal" blur={2} />}
            </Path>
          )}
        </Canvas>
      </GestureDetector>
    </View>
  );
}
