import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const HIRES_ZOOM_THRESHOLD = 1.5;
const TIMING_CONFIG = { duration: 250 };
const MAX_SCALE = 5;

interface ZoomableImageProps {
  url: string;
  hiresUrl?: string | null;
  aspectRatio: number;
}

export function ZoomableImage({
  url,
  hiresUrl,
  aspectRatio,
}: ZoomableImageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const containerWidth = screenWidth - 32;
  const containerHeight = Math.min(
    containerWidth / aspectRatio,
    screenHeight * 0.65,
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);
  const pinchFocalY = useSharedValue(0);

  const [useHires, setUseHires] = useState(false);

  const activateHires = useCallback(() => {
    if (hiresUrl) setUseHires(true);
  }, [hiresUrl]);

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
    const maxX = (containerWidth * (savedScale.value - 1)) / 2;
    const maxY = (containerHeight * (savedScale.value - 1)) / 2;
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
      pinchFocalX.value = e.focalX - containerWidth / 2;
      pinchFocalY.value = e.focalY - containerHeight / 2;
    })
    .onUpdate((e) => {
      const newScale = Math.min(savedScale.value * e.scale, MAX_SCALE);
      scale.value = newScale;
      translateX.value =
        pinchFocalX.value * (1 - e.scale) + savedTranslateX.value * e.scale;
      translateY.value =
        pinchFocalY.value * (1 - e.scale) + savedTranslateY.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        resetTransform();
      } else {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        clampTranslation();
        if (scale.value >= HIRES_ZOOM_THRESHOLD) {
          runOnJS(activateHires)();
        }
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
        runOnJS(activateHires)();
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

  const source = useHires && hiresUrl ? hiresUrl : url;

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: "hidden",
      }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            { width: containerWidth, height: containerHeight },
            animatedStyle,
          ]}
        >
          <Image
            source={{ uri: source }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            transition={useHires ? 200 : 0}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
