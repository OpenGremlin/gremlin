import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import type { FileNode } from "./FilePreview";
import { FilePreview } from "./FilePreview";
import { FilePreviewActions } from "./FilePreviewActions";
import { SheetModal } from "./SheetModal";

interface FilePagerProps {
  visible: boolean;
  files: FileNode[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Modal that hosts a horizontal pager across a task's files.
 * Each page renders a `FilePreview`. Swiping between pages is disabled while
 * the current image is zoomed in; chevrons in the header act as a fallback for
 * any case where horizontal swipe is awkward (zoomed images, video scrubber).
 */
export function FilePager({
  visible,
  files,
  initialIndex,
  onClose,
}: FilePagerProps) {
  const colors = useNavigationTheme();
  const listRef = useRef<FlatList<FileNode>>(null);
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  // Measured size of the modal body. We need explicit pixel dimensions on each
  // page so the inner ScrollView (`flex-1`) has a bounded parent on RN Web,
  // where percentage heights inside a horizontal FlatList don't propagate.
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  // Reset to the requested index whenever the modal (re)opens.
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setZoomed(false);
    }
  }, [visible, initialIndex]);

  // Re-anchor on the current page when the container is resized (rotation,
  // iPad split view, web window resize). Without this the FlatList keeps its
  // old contentOffset and lands between pages.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only width should re-trigger
  useEffect(() => {
    if (!size) return;
    listRef.current?.scrollToIndex({ index, animated: false });
  }, [size?.width]);

  const current = files[index];

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!size) return;
      const next = Math.round(e.nativeEvent.contentOffset.x / size.width);
      if (next !== index) {
        setIndex(next);
        setZoomed(false);
      }
    },
    [index, size],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= files.length) return;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
      setZoomed(false);
    },
    [files.length],
  );

  const renderItem = useCallback(
    ({ item }: { item: FileNode }) => (
      <View style={{ width: size?.width ?? 0, height: size?.height ?? 0 }}>
        <FilePreview render={item.render} onZoomChange={setZoomed} />
      </View>
    ),
    [size],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<FileNode> | null | undefined, i: number) => {
      const w = size?.width ?? 0;
      return { length: w, offset: w * i, index: i };
    },
    [size],
  );

  const headerActions = useMemo(() => {
    if (!current) return null;
    const hasPrev = index > 0;
    const hasNext = index < files.length - 1;
    const showChevrons = files.length > 1;
    return (
      <View className="flex-row items-center gap-2">
        {showChevrons ? (
          <>
            <Text className="text-xs text-text-muted tabular-nums">
              {index + 1} / {files.length}
            </Text>
            <Pressable
              onPress={() => goTo(index - 1)}
              disabled={!hasPrev}
              hitSlop={8}
              style={!hasPrev ? { opacity: 0.3 } : undefined}
            >
              <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
                <ChevronLeft size={16} color={colors.iconDefault} />
              </View>
            </Pressable>
            <Pressable
              onPress={() => goTo(index + 1)}
              disabled={!hasNext}
              hitSlop={8}
              style={!hasNext ? { opacity: 0.3 } : undefined}
            >
              <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
                <ChevronRight size={16} color={colors.iconDefault} />
              </View>
            </Pressable>
          </>
        ) : null}
        <FilePreviewActions file={current} />
      </View>
    );
  }, [colors.iconDefault, current, files.length, goTo, index]);

  if (!current) return null;

  return (
    <SheetModal
      visible={visible}
      title={current.name}
      onClose={onClose}
      headerActions={headerActions}
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {size ? (
          <FlatList
            ref={listRef}
            data={files}
            keyExtractor={(f, i) => `${f.path}-${i}`}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            scrollEnabled={!zoomed}
            onMomentumScrollEnd={onMomentumScrollEnd}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
          />
        ) : null}
      </View>
    </SheetModal>
  );
}
