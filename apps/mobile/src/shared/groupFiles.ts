import type { FileNode } from "./FilePreview";
import { type ImageFile, isImageFile } from "./ImageCollage";

/**
 * Partition files into a single image-collage group (all images, regardless
 * of original position) followed by individual non-image entries. Indices
 * into the original `files` array are kept so a tap can open the unified
 * pager at the right page.
 */
export type FileGroup =
  | { kind: "file"; file: FileNode; index: number }
  | { kind: "images"; files: ImageFile[]; indices: number[] };

export function groupFiles(files: FileNode[]): FileGroup[] {
  const groups: FileGroup[] = [];
  const images: ImageFile[] = [];
  const imageIndices: number[] = [];

  files.forEach((file, index) => {
    if (isImageFile(file)) {
      images.push(file);
      imageIndices.push(index);
    } else {
      groups.push({ kind: "file", file, index });
    }
  });

  if (images.length > 0) {
    groups.unshift({ kind: "images", files: images, indices: imageIndices });
  }

  return groups;
}
