import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MoreHorizontal } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { downloadAuthFile } from "../lib/downloadAuthFile";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { DelayedSpinner } from "./DelayedSpinner";
import type { FileNode, FileQueryNode } from "./FilePreview";
import { codePrintHtml, imagePrintHtml, markdownPrintHtml } from "./printHtml";

type AnyFile = FileNode | FileQueryNode;

/** Returns true if the system print dialog can produce something useful. */
function canPrint(render: AnyFile["render"]): boolean {
  return (
    render.__typename === "DocumentRender" ||
    render.__typename === "CodeRender" ||
    render.__typename === "ImageRender"
  );
}

function urlForRender(render: AnyFile["render"]): string | null {
  if (render.__typename === "ImageRender")
    return render.fullUrl ?? render.url ?? null;
  if (render.__typename === "AudioRender") return render.url ?? null;
  if (render.__typename === "VideoRender") return render.url ?? null;
  return null;
}

export function FilePreviewActions({ file }: { file: AnyFile }) {
  const { token } = useAuth();
  const colors = useNavigationTheme();
  const [busy, setBusy] = useState(false);

  const printable = canPrint(file.render);

  const doShare = useCallback(async () => {
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device");
        return;
      }
      const render = file.render;
      // Text-only renders: write the source to a temp file, then share.
      if (
        render.__typename === "DocumentRender" ||
        render.__typename === "CodeRender"
      ) {
        const text =
          render.__typename === "DocumentRender"
            ? render.markdown
            : render.content;
        const tmp = new File(Paths.cache, "file-preview-share", file.name);
        if (tmp.exists) tmp.delete();
        tmp.create({ intermediates: true });
        tmp.write(text);
        await Sharing.shareAsync(tmp.uri, {
          mimeType:
            file.mimeType ??
            (render.__typename === "DocumentRender"
              ? "text/markdown"
              : "text/plain"),
          dialogTitle: file.name,
        });
        return;
      }
      // Binary renders: download the bytes once, then share the local copy.
      const url = urlForRender(render);
      if (!url) {
        Alert.alert("Nothing to share", "This file has no shareable content.");
        return;
      }
      const local = await downloadAuthFile(url, {
        token,
        filename: file.name,
      });
      await Sharing.shareAsync(local.uri, {
        mimeType: file.mimeType ?? undefined,
        dialogTitle: file.name,
      });
    } catch (e) {
      Alert.alert("Couldn't share file", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [file, token]);

  const doPrint = useCallback(async () => {
    setBusy(true);
    try {
      const render = file.render;
      const title =
        (render.__typename === "DocumentRender" && render.title) || file.name;

      if (render.__typename === "DocumentRender") {
        await Print.printAsync({
          html: markdownPrintHtml(title, render.markdown),
        });
        return;
      }
      if (render.__typename === "CodeRender") {
        await Print.printAsync({
          html: codePrintHtml(title, render.language, render.content),
        });
        return;
      }
      if (render.__typename === "ImageRender") {
        const url = render.fullUrl ?? render.url;
        if (!url) {
          Alert.alert("Nothing to print");
          return;
        }
        const local = await downloadAuthFile(url, {
          token,
          filename: file.name,
        });
        const base64 = await local.base64();
        const mime = file.mimeType ?? "image/jpeg";
        const dataUri = `data:${mime};base64,${base64}`;
        await Print.printAsync({ html: imagePrintHtml(title, dataUri) });
        return;
      }
      Alert.alert("Can't print this file type");
    } catch (e) {
      // User cancelling the print dialog throws on iOS — swallow that case.
      const msg = (e as Error).message ?? "";
      if (!/cancel|did not complete/i.test(msg)) {
        Alert.alert("Couldn't print file", msg);
      }
    } finally {
      setBusy(false);
    }
  }, [file, token]);

  const openMenu = useCallback(() => {
    if (busy) return;
    const options: { label: string; onPress: () => void }[] = [
      { label: "Share", onPress: doShare },
    ];
    if (printable) options.push({ label: "Print", onPress: doPrint });

    const labels = options.map((o) => o.label);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, "Cancel"],
          cancelButtonIndex: labels.length,
        },
        (idx) => {
          if (idx >= 0 && idx < options.length) options[idx].onPress();
        },
      );
    } else {
      Alert.alert(file.name, undefined, [
        ...options.map((o) => ({ text: o.label, onPress: o.onPress })),
        { text: "Cancel", style: "cancel" as const },
      ]);
    }
  }, [busy, doPrint, doShare, file.name, printable]);

  return (
    <Pressable onPress={openMenu} hitSlop={8}>
      <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center">
        {busy ? (
          <DelayedSpinner />
        ) : (
          <MoreHorizontal size={16} color={colors.iconDefault} />
        )}
      </View>
    </Pressable>
  );
}
