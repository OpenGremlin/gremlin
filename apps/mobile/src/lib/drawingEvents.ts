import type { UploadableFile } from "../hooks/useFileUpload";

type Listener = (file: UploadableFile) => void;

const listeners = new Set<Listener>();

export const drawingEvents = {
  on(callback: Listener) {
    listeners.add(callback);
  },
  off(callback: Listener) {
    listeners.delete(callback);
  },
  emit(file: UploadableFile) {
    for (const cb of listeners) cb(file);
  },
};
