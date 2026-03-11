import type { StyleSheet as RNStyleSheet } from "react-native";
import MarkdownDisplay from "react-native-markdown-display";

const darkStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  body: { color: "#e5e5e5", fontSize: 14, lineHeight: 20 },
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
  link: { color: "#60a5fa", textDecorationLine: "underline" },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#525252",
    paddingLeft: 10,
    marginLeft: 0,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: "#262626",
    color: "#a3e635",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontFamily: "monospace",
    fontSize: 13,
  },
  fence: {
    backgroundColor: "#171717",
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
    backgroundColor: "#171717",
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
  bullet_list_icon: { color: "#737373", marginRight: 6 },
  ordered_list_icon: { color: "#737373", marginRight: 6 },
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

const userStyles: Parameters<typeof RNStyleSheet.create>[0] = {
  ...darkStyles,
  body: { ...darkStyles.body, color: "#ffffff" },
};

export function Markdown({
  children,
  variant = "agent",
}: {
  children: string;
  variant?: "agent" | "user";
}) {
  return (
    <MarkdownDisplay style={variant === "user" ? userStyles : darkStyles}>
      {children}
    </MarkdownDisplay>
  );
}
