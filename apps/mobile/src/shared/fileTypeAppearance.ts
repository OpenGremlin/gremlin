import type { LucideIcon } from "lucide-react-native";
import {
  Archive,
  Code,
  File,
  FileAudio,
  FileText,
  FileVideo,
  Image,
} from "lucide-react-native";
import React from "react";
import { FileType } from "../graphql/generated/graphql";
import { useTheme } from "../lib/ThemeContext";

type FileTypeAppearance = {
  icon: LucideIcon;
  lightColor: string;
  darkColor: string;
};

const CODE: FileTypeAppearance = {
  icon: Code,
  lightColor: "#f59e0b",
  darkColor: "#fbbf24",
};

const FILE_TYPE_MAP: Record<FileType, FileTypeAppearance> = {
  [FileType.Javascript]: CODE,
  [FileType.Typescript]: CODE,
  [FileType.Python]: CODE,
  [FileType.Go]: CODE,
  [FileType.Rust]: CODE,
  [FileType.Java]: CODE,
  [FileType.Swift]: CODE,
  [FileType.Shell]: CODE,
  [FileType.Web]: CODE,
  [FileType.Config]: CODE,
  [FileType.CodeOther]: CODE,
  [FileType.Document]: {
    icon: FileText,
    lightColor: "#2563eb",
    darkColor: "#93c5fd",
  },
  [FileType.Pdf]: {
    icon: FileText,
    lightColor: "#dc2626",
    darkColor: "#f87171",
  },
  [FileType.Image]: {
    icon: Image,
    lightColor: "#ec4899",
    darkColor: "#f9a8d4",
  },
  [FileType.Audio]: {
    icon: FileAudio,
    lightColor: "#8b5cf6",
    darkColor: "#c4b5fd",
  },
  [FileType.Video]: {
    icon: FileVideo,
    lightColor: "#7c3aed",
    darkColor: "#a78bfa",
  },
  [FileType.Archive]: {
    icon: Archive,
    lightColor: "#92400e",
    darkColor: "#d97706",
  },
  [FileType.Unknown]: {
    icon: File,
    lightColor: "#737373",
    darkColor: "#a3a3a3",
  },
};

export function getFileTypeAppearance(
  fileType: FileType | null | undefined,
  isDark: boolean,
): { Icon: LucideIcon; color: string } {
  const entry = FILE_TYPE_MAP[fileType ?? FileType.Unknown];
  return {
    Icon: entry.icon,
    color: isDark ? entry.darkColor : entry.lightColor,
  };
}

export function FileTypeIcon({
  fileType,
  size = 18,
}: {
  fileType: FileType | null | undefined;
  size?: number;
}) {
  const { isDark } = useTheme();
  const { Icon, color } = getFileTypeAppearance(fileType, isDark);
  return React.createElement(Icon, { size, color });
}
