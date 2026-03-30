import { useCallback, useState } from "react";
import {
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AuthImage } from "./AuthImage";

const FULL_RES_ZOOM_THRESHOLD = 1.5;
const TIMING_CONFIG = { duration: 250 };
const MIN_MAX_SCALE = 10;

interface ZoomableImageProps {
  url: string;
  fullUrl?: string | null;
  aspectRatio: number;
  nativeWidth?: number | null;
}

export function ZoomableImage({
  url,
  fullUrl,
  aspectRatio,
  nativeWidth,
}: ZoomableImageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const imageWidth = screenWidth - 32;
  const imageHeight = Math.min(imageWidth / aspectRatio, screenHeight * 0.65);

  // Allow zooming to 2× past native pixel density (accept mild pixelation).
  const nativeScale = nativeWidth ? nativeWidth / imageWidth : 1;
  const maxScale = Math.max(nativeScale * 2, MIN_MAX_SCALE);

  const bodyW = useSharedValue(screenWidth);
  const bodyH = useSharedValue(screenHeight * 0.8);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);
  const pinchFocalY = useSharedValue(0);

  const [useFullRes, setUseFullRes] = useState(false);

  const activateFullRes = useCallback(() => {
    if (fullUrl) setUseFullRes(true);
  }, [fullUrl]);

  const onBodyLayout = useCallback(
    (e: LayoutChangeEvent) => {
      bodyW.value = e.nativeEvent.layout.width;
      bodyH.value = e.nativeEvent.layout.height;
    },
    [bodyW, bodyH],
  );

  const resetTransform = () => {
    "worklet";
    scale.value = withTiming(1, TIMING_CONFIG);
    translateX.value = withTiming(0, TIMING_CONFIG);
    translateY.value = withTiming(0, TIMING_CONFIG);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const clampTranslation = () => {
    "worklet";
    const scaledW = imageWidth * savedScale.value;
    const scaledH = imageHeight * savedScale.value;
    const maxX = Math.max(0, (scaledW - bodyW.value) / 2);
    const maxY = Math.max(0, (scaledH - bodyH.value) / 2);
    const clampedX = Math.max(-maxX, Math.min(maxX, translateX.value));
    const clampedY = Math.max(-maxY, Math.min(maxY, translateY.value));
    if (clampedX !== translateX.value || clampedY !== translateY.value) {
      translateX.value = withTiming(clampedX, TIMING_CONFIG);
      translateY.value = withTiming(clampedY, TIMING_CONFIG);
    }
    savedTranslateX.value = clampedX;
    savedTranslateY.value = clampedY;
  };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      pinchFocalX.value = e.focalX - imageWidth / 2;
      pinchFocalY.value = e.focalY - imageHeight / 2;
    })
    .onUpdate((e) => {
      const newScale = Math.max(
        1,
        Math.min(savedScale.value * e.scale, maxScale),
      );
      scale.value = newScale;
      const effectiveScale = newScale / savedScale.value;
      translateX.value =
        pinchFocalX.value * (1 - effectiveScale) +
        savedTranslateX.value * effectiveScale;
      translateY.value =
        pinchFocalY.value * (1 - effectiveScale) +
        savedTranslateY.value * effectiveScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      clampTranslation();
      if (scale.value >= FULL_RES_ZOOM_THRESHOLD) {
        runOnJS(activateFullRes)();
      }
    });

  const pan = Gesture.Pan()
    .minDistance(5)
    .manualActivation(true)
    .onTouchesMove((_e, manager) => {
      if (savedScale.value > 1) {
        manager.activate();
      } else {
        manager.fail();
      }
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      clampTranslation();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        resetTransform();
      } else {
        scale.value = withTiming(2, TIMING_CONFIG);
        savedScale.value = 2;
        runOnJS(activateFullRes)();
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const source = useFullRes && fullUrl ? fullUrl : url;

  return (
    <View
      onLayout={onBodyLayout}
      style={{
        flex: 1,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[{ width: imageWidth, height: imageHeight }, animatedStyle]}
        >
          <AuthImage
            uri={source}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            transition={useFullRes ? 200 : 0}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
