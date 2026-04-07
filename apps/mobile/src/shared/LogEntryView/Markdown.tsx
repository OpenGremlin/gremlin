import type { ReactNode } from "react";
import { useMemo } from "react";
import { Platform, type TextStyle, type ViewStyle } from "react-native";
import type { MarkedStyles } from "react-native-marked";
import Marked, { Renderer } from "react-native-marked";
import { useTheme } from "../../lib/ThemeContext";

// "monospace" is an Android-only alias; iOS silently falls back to the system
// proportional font. Pick a real family per platform.
const MONO_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

function buildStyles(
  base: number,
  theme: "dark" | "light",
  variant: "agent" | "user",
): MarkedStyles {
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
  const codeColor = isDark ? "#a3e635" : "#15603a";
  const fenceBg = isDark ? "#1a1a1a" : "#fafafa";
  const fenceBorder = isDark ? "#404040" : "#e5e5e5";
  const quoteBorder = isDark ? "#636363" : "#d4d4d4";
  const hrColor = isDark ? "#404040" : "#e5e5e5";
  const tdColor = isDark ? "#e5e5e5" : "#4b5563";

  const styles: MarkedStyles = {
    text: {
      fontSize: base,
      lineHeight,
      color: bodyColor,
    },
    paragraph: { marginTop: 0, marginBottom: 6 } as ViewStyle,
    h1: {
      color: headingColor,
      fontSize: base + 6,
      fontWeight: "700",
      marginBottom: 8,
      marginTop: 12,
    },
    h2: {
      color: headingColor,
      fontSize: base + 4,
      fontWeight: "700",
      marginBottom: 6,
      marginTop: 10,
    },
    h3: {
      color: headingColor,
      fontSize: base + 2,
      fontWeight: "600",
      marginBottom: 4,
      marginTop: 8,
    },
    h4: {
      color: headingColor,
      fontSize: base + 1,
      fontWeight: "600",
      marginBottom: 4,
      marginTop: 6,
    },
    h5: {
      color: headingColor,
      fontSize: base,
      fontWeight: "600",
      marginBottom: 2,
      marginTop: 4,
    },
    h6: {
      color: headingColor,
      fontSize: base - 1,
      fontWeight: "600",
      marginBottom: 2,
      marginTop: 4,
    },
    strong: {
      fontWeight: "700",
      color: headingColor,
      fontSize: base,
      lineHeight,
    },
    em: { fontStyle: "italic", fontSize: base, lineHeight },
    strikethrough: {
      textDecorationLine: "line-through",
      fontSize: base,
      lineHeight,
    },
    link: {
      color: linkColor,
      textDecorationLine: "underline",
      fontSize: base,
      lineHeight,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: quoteBorder,
      paddingLeft: 10,
      marginLeft: 0,
      marginVertical: 6,
      backgroundColor: "transparent",
    } as ViewStyle,
    codespan: {
      backgroundColor: codeBg,
      color: codeColor,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      fontFamily: MONO_FONT,
      fontSize: base - 1,
      lineHeight: Math.round((base - 1) * 1.45),
    },
    code: {
      backgroundColor: fenceBg,
      borderColor: fenceBorder,
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      marginVertical: 6,
    } as ViewStyle,
    li: { marginVertical: 2, fontSize: base, lineHeight } as TextStyle,
    list: { marginVertical: 4 } as ViewStyle,
    hr: {
      backgroundColor: hrColor,
      height: 1,
      marginVertical: 10,
    } as ViewStyle,
    table: {
      borderColor: hrColor,
      borderWidth: 1,
      borderRadius: 4,
      marginVertical: 6,
    } as ViewStyle,
    tableRow: {
      borderBottomWidth: 1,
      borderColor: hrColor,
    } as ViewStyle,
    tableCell: { padding: 6, color: tdColor } as ViewStyle,
  };

  return styles;
}

class CodeTextRenderer extends Renderer {
  private codeTextStyle: TextStyle;

  constructor(codeTextStyle: TextStyle) {
    super();
    this.codeTextStyle = codeTextStyle;
  }

  code(
    text: string,
    _language?: string,
    containerStyle?: ViewStyle,
    _textStyle?: TextStyle,
  ): ReactNode {
    return super.code(text, _language, containerStyle, this.codeTextStyle);
  }
}

export function Markdown({
  children,
  variant = "agent",
}: {
  children: string;
  variant?: "agent" | "user";
}) {
  const { isDark } = useTheme();

  const styles = useMemo(
    () => buildStyles(14, isDark ? "dark" : "light", variant),
    [isDark, variant],
  );

  const renderer = useMemo(() => {
    const codeColor = isDark ? "#a3e635" : "#15603a";
    return new CodeTextRenderer({
      fontFamily: MONO_FONT,
      fontSize: 12,
      color: codeColor,
    });
  }, [isDark]);

  return (
    <Marked
      value={children}
      styles={styles}
      renderer={renderer}
      flatListProps={{
        scrollEnabled: false,
        style: { backgroundColor: "transparent" },
      }}
    />
  );
}
