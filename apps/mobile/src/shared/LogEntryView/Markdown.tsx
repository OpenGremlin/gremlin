import MarkdownIt from "markdown-it";
import type { StyleSheet as RNStyleSheet } from "react-native";
import MarkdownDisplay from "react-native-markdown-display";
import { useTheme } from "../../lib/ThemeContext";

const md = MarkdownIt({ typographer: true, linkify: true });

const darkStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  body: { color: "#c2c2c2", fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading1: {
    color: "#f5f5f5",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  heading3: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  strong: { fontWeight: "700", color: "#f5f5f5" },
  em: { fontStyle: "italic" },
  link: { color: "#818cf8", textDecorationLine: "underline" },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#636363",
    paddingLeft: 10,
    marginLeft: 0,
    marginVertical: 6,
    backgroundColor: "transparent",
    color: "#c2c2c2",
  },
  code_inline: {
    backgroundColor: "#2a2a2a",
    color: "#a3e635",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontFamily: "monospace",
    fontSize: 13,
  },
  fence: {
    backgroundColor: "#1a1a1a",
    borderColor: "#404040",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#a3e635",
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: "#1a1a1a",
    borderColor: "#404040",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#a3e635",
    marginVertical: 6,
  },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  bullet_list_icon: { color: "#8a8a8a", marginRight: 6 },
  ordered_list_icon: { color: "#8a8a8a", marginRight: 6 },
  hr: {
    backgroundColor: "#404040",
    height: 1,
    marginVertical: 10,
  },
  table: {
    borderColor: "#404040",
    borderWidth: 1,
    borderRadius: 4,
    marginVertical: 6,
  },
  tr: { borderBottomWidth: 1, borderColor: "#404040" },
  th: { padding: 6, color: "#f5f5f5", fontWeight: "600" },
  td: { padding: 6, color: "#e5e5e5" },
};

const darkUserStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  ...darkStyles,
  body: { ...darkStyles.body, color: "#ffffff" },
  link: { color: "#c7d2fe", textDecorationLine: "underline" },
};

const lightStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  body: { color: "#4b5563", fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading1: {
    color: "#374151",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    color: "#374151",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  heading3: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  strong: { fontWeight: "700", color: "#374151" },
  em: { fontStyle: "italic" },
  link: { color: "#4f46e5", textDecorationLine: "underline" },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#d4d4d4",
    paddingLeft: 10,
    marginLeft: 0,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: "#f5f5f5",
    color: "#16a34a",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontFamily: "monospace",
    fontSize: 13,
  },
  fence: {
    backgroundColor: "#fafafa",
    borderColor: "#e5e5e5",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#16a34a",
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: "#fafafa",
    borderColor: "#e5e5e5",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#16a34a",
    marginVertical: 6,
  },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  bullet_list_icon: { color: "#a3a3a3", marginRight: 6 },
  ordered_list_icon: { color: "#a3a3a3", marginRight: 6 },
  hr: {
    backgroundColor: "#e5e5e5",
    height: 1,
    marginVertical: 10,
  },
  table: {
    borderColor: "#e5e5e5",
    borderWidth: 1,
    borderRadius: 4,
    marginVertical: 6,
  },
  tr: { borderBottomWidth: 1, borderColor: "#e5e5e5" },
  th: { padding: 6, color: "#374151", fontWeight: "600" },
  td: { padding: 6, color: "#4b5563" },
};

const lightUserStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  ...lightStyles,
  body: { ...lightStyles.body, color: "#ffffff" },
  link: { color: "#e0e7ff", textDecorationLine: "underline" },
};

export function Markdown({
  children,
  variant = "agent",
}: {
  children: string;
  variant?: "agent" | "user";
}) {
  const { isDark } = useTheme();

  const style =
    variant === "user"
      ? isDark
        ? darkUserStyles
        : lightUserStyles
      : isDark
        ? darkStyles
        : lightStyles;

  return (
    <MarkdownDisplay style={style} markdownit={md}>
      {children}
    </MarkdownDisplay>
  );
}
