import { useQuery } from "@apollo/client";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { FileQuery } from "../graphql/queries";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import type { FileNode, FileQueryNode } from "./FilePreview";
import { FilePreview } from "./FilePreview";
import { FilePreviewActions } from "./FilePreviewActions";
import { Sheet } from "./Sheet";

/** A lightweight entry that the pager can lazy-load render data for. */
export interface PagerFileEntry {
  path: string;
  name: string;
}

type AnyEntry = FileNode | PagerFileEntry;

function hasRender(entry: AnyEntry): entry is FileNode {
  return "render" in entry && entry.render != null;
}

function useResolvedFile(entry: AnyEntry): {
  file: FileNode | FileQueryNode | null;
  loading: boolean;
  error: boolean;
} {
  const needsFetch = !hasRender(entry);
  const { data, loading, error } = useQuery(FileQuery, {
    variables: { path: entry.path },
    skip: !needsFetch,
  });
  if (!needsFetch)
    return { file: entry as FileNode, loading: false, error: false };
  return { file: data?.file ?? null, loading, error: !!error };
}

function PagerPage({
  entry,
  onZoomChange,
}: {
  entry: AnyEntry;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const { file, loading, error } = useResolvedFile(entry);
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </View>
    );
  }
  if (error || !file) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">
          Unable to load this file
        </Text>
      </View>
    );
  }
  return <FilePreview render={file.render} onZoomChange={onZoomChange} />;
}

function PagerActions({ file }: { file: FileNode | FileQueryNode | null }) {
  if (!file) return null;
  return <FilePreviewActions file={file} />;
}

/**
 * Shared file pager wrapped in a Sheet. Horizontal swipe across files
 * with lazy loading, chevron navigation, and file actions in the header.
 */
export function FilePagerSheet({
  files,
  initialIndex,
}: {
  files: AnyEntry[];
  initialIndex: number;
}) {
  const colors = useNavigationTheme();
  const listRef = useRef<FlatList<AnyEntry>>(null);
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const current = files[index];
  const { file: resolvedCurrent } = useResolvedFile(
    current ?? { path: "", name: "" },
  );

  const title = current?.name ?? "File";

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= files.length) return;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
      setZoomed(false);
    },
    [files.length],
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
        <PagerActions file={resolvedCurrent} />
      </View>
    );
  }, [colors.iconDefault, resolvedCurrent, files.length, goTo, index, current]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only width should re-trigger
  useEffect(() => {
    if (!size) return;
    listRef.current?.scrollToIndex({ index, animated: false });
  }, [size?.width]);

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

  const renderItem = useCallback(
    ({ item }: { item: AnyEntry }) => (
      <View style={{ width: size?.width ?? 0, height: size?.height ?? 0 }}>
        <PagerPage entry={item} onZoomChange={setZoomed} />
      </View>
    ),
    [size],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<AnyEntry> | null | undefined, i: number) => {
      const w = size?.width ?? 0;
      return { length: w, offset: w * i, index: i };
    },
    [size],
  );

  if (files.length === 0) return null;

  return (
    <Sheet title={title} headerActions={headerActions}>
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
    </Sheet>
  );
}
