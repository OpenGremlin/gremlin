import { useQuery } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
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
import { FileQuery } from "../../src/graphql/queries";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import type { FileNode, FileQueryNode } from "../../src/shared/FilePreview";
import { FilePreview } from "../../src/shared/FilePreview";
import { FilePreviewActions } from "../../src/shared/FilePreviewActions";
import { Sheet } from "../../src/shared/Sheet";

/** A lightweight entry that the pager can lazy-load render data for. */
export interface PagerFileEntry {
  path: string;
  name: string;
}

export interface FilePagerSheetPayload {
  files: FileNode[] | PagerFileEntry[];
  initialIndex: number;
}

type AnyEntry = FileNode | PagerFileEntry;

/** Returns true if the entry has pre-loaded render data (i.e. is a full FileNode). */
function hasRender(entry: AnyEntry): entry is FileNode {
  return "render" in entry && entry.render != null;
}

/** Hook that returns the full file data, either from the entry itself or via a lazy query. */
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

/** Renders a single pager page — uses pre-loaded render data or fetches it lazily. */
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

/** Header actions with resolved file data passed in from the parent. */
function PagerActions({ file }: { file: FileNode | FileQueryNode | null }) {
  if (!file) return null;
  return <FilePreviewActions file={file} />;
}

/**
 * Horizontal pager across a task's files. Each page is a FilePreview;
 * swiping between pages is disabled while the current image is zoomed.
 * Header chevrons are a fallback for cases where horizontal swipe is
 * awkward (zoomed images, video scrubber).
 */

export default function FilePagerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<FilePagerSheetPayload>(id);
  const colors = useNavigationTheme();
  const listRef = useRef<FlatList<AnyEntry>>(null);
  const [index, setIndex] = useState(payload?.initialIndex ?? 0);
  const [zoomed, setZoomed] = useState(false);
  // Measured size of the body. Each page needs explicit pixel dimensions
  // so the inner ScrollView (`flex-1`) has a bounded parent on RN Web.
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  // Re-anchor on the current page when the container is resized
  // (rotation, iPad split view). Without this the FlatList keeps its
  // old contentOffset and lands between pages.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only width should re-trigger
  useEffect(() => {
    if (!size) return;
    listRef.current?.scrollToIndex({ index, animated: false });
  }, [size?.width]);

  const files: AnyEntry[] = payload?.files ?? [];
  const current = files[index];
  // Resolve the current entry once so the header actions share the same query
  // as the visible page instead of firing a duplicate request.
  const { file: resolvedCurrent } = useResolvedFile(
    current ?? { path: "", name: "" },
  );

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

  if (!payload || !current) return null;

  return (
    <Sheet title={current.name} headerActions={headerActions}>
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
            initialScrollIndex={payload.initialIndex}
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
