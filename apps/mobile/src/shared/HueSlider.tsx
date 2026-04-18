import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, PanResponder, View } from "react-native";
import { hueToHex } from "../lib/color";

const TRACK_HEIGHT = 16;
const THUMB_SIZE = 28;

// Enough stops that the gradient reads as continuous rather than banded.
const GRADIENT_STOPS = Array.from({ length: 13 }, (_, i) =>
  hueToHex((i * 360) / 12),
) as [string, string, ...string[]];

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
  /** Called with the final value when the gesture ends — use for persistence. */
  onChangeEnd?: (hue: number) => void;
  disabled?: boolean;
}

export function HueSlider({
  hue,
  onChange,
  onChangeEnd,
  disabled,
}: HueSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const latestHueRef = useRef(hue);
  latestHueRef.current = hue;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  }, []);

  const updateFromX = useCallback(
    (x: number) => {
      const w = widthRef.current;
      if (w <= 0) return;
      const clamped = Math.max(0, Math.min(w, x));
      const nextHue = (clamped / w) * 360;
      latestHueRef.current = nextHue;
      onChange(nextHue);
    },
    [onChange],
  );

  const commit = useCallback(() => {
    onChangeEnd?.(latestHueRef.current);
  }, [onChangeEnd]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
        onPanResponderRelease: () => commit(),
        onPanResponderTerminate: () => commit(),
      }),
    [disabled, updateFromX, commit],
  );

  const thumbX = width > 0 ? (hue / 360) * width : 0;
  const thumbColor = hueToHex(hue);

  return (
    <View
      onLayout={onLayout}
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Agent color hue"
      accessibilityValue={{ min: 0, max: 360, now: Math.round(hue) }}
      style={{
        height: THUMB_SIZE,
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <LinearGradient
        colors={GRADIENT_STOPS}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
        }}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: thumbX - THUMB_SIZE / 2,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: thumbColor,
          borderWidth: 3,
          borderColor: "#ffffff",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      />
    </View>
  );
}
