import { Pressable, Text, View } from "react-native";
import { AuthImage } from "./AuthImage";
import type { FileNode } from "./FilePreview";

const GAP = 0;

/** A file we know has a renderable image url. */
export type ImageFile = FileNode & {
  render: Extract<FileNode["render"], { __typename: "ImageRender" }> & {
    url: string;
  };
};

/** Narrow a file to ImageFile if it has a renderable image url. */
export function isImageFile(file: FileNode): file is ImageFile {
  return file.render?.__typename === "ImageRender" && !!file.render.url;
}

interface ImageCollageProps {
  images: ImageFile[];
  /** Called with the image's index inside `images`. */
  onPressImage: (index: number) => void;
}

function Tile({
  image,
  onPress,
  overlayCount,
}: {
  image: ImageFile;
  onPress: () => void;
  overlayCount?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, overflow: "hidden", position: "relative" }}
    >
      <AuthImage
        uri={image.render.url}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
      {overlayCount ? (
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "600",
            }}
          >
            +{overlayCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Renders 1–N image attachments as a single bounded collage block.
 *  - 1: full-width, natural aspect ratio (no cap)
 *  - 2: two equal columns, square tiles
 *  - 3: one big tile left, two stacked right (square block)
 *  - 4+: 2×2 grid (square block); fourth tile shows "+N" if there are more
 *
 * All tiles call `onPressImage` with the image's index.
 */
export function ImageCollage({ images, onPressImage }: ImageCollageProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    const img = images[0];
    return (
      <View style={{ borderRadius: 8, overflow: "hidden", width: "100%" }}>
        <Pressable onPress={() => onPressImage(0)}>
          <AuthImage
            uri={img.render.url}
            style={{
              width: "100%",
              aspectRatio: img.render.aspectRatio ?? 1,
            }}
            contentFit="cover"
          />
        </Pressable>
      </View>
    );
  }

  if (images.length === 2) {
    return (
      <View
        style={{
          borderRadius: 8,
          overflow: "hidden",
          width: "100%",
          aspectRatio: 2,
          flexDirection: "row",
          gap: GAP,
        }}
      >
        <Tile image={images[0]} onPress={() => onPressImage(0)} />
        <Tile image={images[1]} onPress={() => onPressImage(1)} />
      </View>
    );
  }

  if (images.length === 3) {
    return (
      <View
        style={{
          borderRadius: 8,
          overflow: "hidden",
          width: "100%",
          aspectRatio: 1,
          flexDirection: "row",
          gap: GAP,
        }}
      >
        <Tile image={images[0]} onPress={() => onPressImage(0)} />
        <View style={{ flex: 1, flexDirection: "column", gap: GAP }}>
          <Tile image={images[1]} onPress={() => onPressImage(1)} />
          <Tile image={images[2]} onPress={() => onPressImage(2)} />
        </View>
      </View>
    );
  }

  // 4 or more: 2x2 grid, +N overlay on tile 4 if there are more.
  const overflow = images.length > 4 ? images.length - 4 : 0;
  return (
    <View
      style={{
        borderRadius: 8,
        overflow: "hidden",
        width: "100%",
        aspectRatio: 1,
        flexDirection: "column",
        gap: GAP,
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>
        <Tile image={images[0]} onPress={() => onPressImage(0)} />
        <Tile image={images[1]} onPress={() => onPressImage(1)} />
      </View>
      <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>
        <Tile image={images[2]} onPress={() => onPressImage(2)} />
        <Tile
          image={images[3]}
          onPress={() => onPressImage(3)}
          overlayCount={overflow || undefined}
        />
      </View>
    </View>
  );
}
