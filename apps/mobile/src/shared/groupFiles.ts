import type { FileNode } from "./FilePreview";
import { type ImageFile, isImageFile } from "./ImageCollage";

/**
 * Group consecutive image files into collage blocks while preserving the
 * original interleaved order. Each entry is either a single non-image file or
 * a run of >=1 images. Indices into the original `files` array are kept so a
 * tap can open the unified pager at the right page.
 */
export type FileGroup =
  | { kind: "file"; file: FileNode; index: number }
  | { kind: "images"; files: ImageFile[]; indices: number[] };

export function groupFiles(files: FileNode[]): FileGroup[] {
  const groups: FileGroup[] = [];
  let run: { files: ImageFile[]; indices: number[] } | null = null;
  const flush = () => {
    if (run) {
      groups.push({ kind: "images", files: run.files, indices: run.indices });
      run = null;
    }
  };
  files.forEach((file, index) => {
    if (isImageFile(file)) {
      if (!run) run = { files: [], indices: [] };
      run.files.push(file);
      run.indices.push(index);
    } else {
      flush();
      groups.push({ kind: "file", file, index });
    }
  });
  flush();
  return groups;
}
