import MarkdownIt from "markdown-it";
import { useMemo } from "react";
import type { StyleSheet as RNStyleSheet } from "react-native";
import MarkdownDisplay from "react-native-markdown-display";
import { useTheme } from "../../lib/ThemeContext";

const md = MarkdownIt({ typographer: true, linkify: true });

type Styles = Parameters<typeof RNStyleSheet.create>[0];

function buildStyles(
  base: number,
  theme: "dark" | "light",
  variant: "agent" | "user",
): Styles {
  const isDark = theme === "dark";
  const lineHeight = Math.round(base * 1.45);

  const bodyColor =
    variant === "user" ? "#ffffff" : isDark ? "#c2c2c2" : "#4b5563";
  const headingColor = isDark ? "#f5f5f5" : "#374151";
  const linkColor =
    variant === "user"
      ? isDark
        ? "#c7d2fe"
        : "#e0e7ff"
      : isDark
        ? "#818cf8"
        : "#4f46e5";
  const codeBg = isDark ? "#2a2a2a" : "#f5f5f5";
  const codeColor = isDark ? "#a3e635" : "#16a34a";
  const fenceBg = isDark ? "#1a1a1a" : "#fafafa";
  const fenceBorder = isDark ? "#404040" : "#e5e5e5";
  const quoteBorder = isDark ? "#636363" : "#d4d4d4";
  const bulletColor = isDark ? "#8a8a8a" : "#a3a3a3";
  const hrColor = isDark ? "#404040" : "#e5e5e5";
  const thColor = isDark ? "#f5f5f5" : "#374151";
  const tdColor = isDark ? "#e5e5e5" : "#4b5563";

  return {
    body: { color: bodyColor, fontSize: base, lineHeight },
    paragraph: { marginTop: 0, marginBottom: 6 },
    heading1: {
      color: headingColor,
      fontSize: base + 6,
      fontWeight: "700",
      marginBottom: 8,
      marginTop: 12,
    },
    heading2: {
      color: headingColor,
      fontSize: base + 4,
      fontWeight: "700",
      marginBottom: 6,
      marginTop: 10,
    },
    heading3: {
      color: headingColor,
      fontSize: base + 2,
      fontWeight: "600",
      marginBottom: 4,
      marginTop: 8,
    },
    strong: { fontWeight: "700", color: headingColor },
    em: { fontStyle: "italic" },
    link: { color: linkColor, textDecorationLine: "underline" },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: quoteBorder,
      paddingLeft: 10,
      marginLeft: 0,
      marginVertical: 6,
      backgroundColor: "transparent",
      color: bodyColor,
    },
    code_inline: {
      backgroundColor: codeBg,
      color: codeColor,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      fontFamily: "monospace",
      fontSize: base - 1,
    },
    fence: {
      backgroundColor: fenceBg,
      borderColor: fenceBorder,
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      fontFamily: "monospace",
      fontSize: base - 2,
      color: codeColor,
      marginVertical: 6,
    },
    code_block: {
      backgroundColor: fenceBg,
      borderColor: fenceBorder,
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      fontFamily: "monospace",
      fontSize: base - 2,
      color: codeColor,
      marginVertical: 6,
    },
    list_item: { marginVertical: 2 },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    bullet_list_icon: { color: bulletColor, marginRight: 6 },
    ordered_list_icon: { color: bulletColor, marginRight: 6 },
    hr: { backgroundColor: hrColor, height: 1, marginVertical: 10 },
    table: {
      borderColor: hrColor,
      borderWidth: 1,
      borderRadius: 4,
      marginVertical: 6,
    },
    tr: { borderBottomWidth: 1, borderColor: hrColor },
    th: { padding: 6, color: thColor, fontWeight: "600" },
    td: { padding: 6, color: tdColor },
  };
}

export function Markdown({
  children,
  variant = "agent",
}: {
  children: string;
  variant?: "agent" | "user";
}) {
  const { isDark } = useTheme();

  const style = useMemo(
    () => buildStyles(14, isDark ? "dark" : "light", variant),
    [isDark, variant],
  );

  return (
    <MarkdownDisplay style={style} markdownit={md}>
      {children}
    </MarkdownDisplay>
  );
}
