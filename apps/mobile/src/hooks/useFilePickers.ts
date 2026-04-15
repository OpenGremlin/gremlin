import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { ActionSheetIOS, Alert } from "react-native";
import { hasDraft } from "../lib/drawingDraft";
import { drawingEvents } from "../lib/drawingEvents";

type FileEntry = { uri: string; name: string; size: number; type: string };

export function useFilePickers(
  agentId: string,
  uploadFiles: (files: FileEntry[]) => void,
) {
  // Subscribe to drawing-complete events for upload
  useEffect(() => {
    const handler = (file: FileEntry) => {
      uploadFiles([file]);
    };
    drawingEvents.on(handler);
    return () => drawingEvents.off(handler);
  }, [uploadFiles]);

  const pickDocuments = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    uploadFiles(
      result.assets.map((asset) => ({
        name: asset.name,
        size: asset.size ?? 0,
        type: asset.mimeType ?? "application/octet-stream",
        uri: asset.uri,
      })),
    );
  }, [uploadFiles]);

  const pickImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;
    uploadFiles(
      result.assets.map((asset) => ({
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "image",
        size: asset.fileSize ?? 0,
        type: asset.mimeType ?? "image/jpeg",
        uri: asset.uri,
      })),
    );
  }, [uploadFiles]);

  const takePhoto = useCallback(async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) return;
    const result = await ImagePicker.launchCameraAsync();
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    if (!mediaPermission.granted) return;
    await MediaLibrary.saveToLibraryAsync(asset.uri);

    uploadFiles([
      {
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "photo",
        size: asset.fileSize ?? 0,
        type: asset.mimeType ?? "image/jpeg",
        uri: asset.uri,
      },
    ]);
  }, [uploadFiles]);

  const openDrawing = useCallback(
    (mode: "new" | "continue") => {
      router.push({
        pathname: "/draw",
        params: { agentId, mode },
      });
    },
    [agentId],
  );

  const handlePickFiles = useCallback(() => {
    if (process.env.EXPO_OS === "web") {
      pickDocuments();
      return;
    }

    const hasDraftNow = hasDraft(agentId);

    const options = [
      "Photo Library",
      "Take Photo",
      "Choose File",
      "New Drawing",
      ...(hasDraftNow ? ["Continue Drawing"] : []),
      "Cancel",
    ];
    const cancelIndex = options.length - 1;

    const handleOption = (index: number) => {
      if (index === 0) pickImages();
      else if (index === 1) takePhoto();
      else if (index === 2) pickDocuments();
      else if (index === 3) openDrawing("new");
      else if (index === 4 && hasDraftNow) openDrawing("continue");
    };

    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        handleOption,
      );
    } else {
      const buttons = [
        { text: "Photo Library", onPress: () => pickImages() },
        { text: "Take Photo", onPress: () => takePhoto() },
        { text: "Choose File", onPress: () => pickDocuments() },
        { text: "New Drawing", onPress: () => openDrawing("new") },
        ...(hasDraftNow
          ? [
              {
                text: "Continue Drawing",
                onPress: () => openDrawing("continue"),
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ];
      Alert.alert("Upload", undefined, buttons);
    }
  }, [pickDocuments, pickImages, takePhoto, openDrawing, agentId]);

  return { handlePickFiles };
}
