import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const viewImage: HintBuilder = (input) => ({
  text: `Viewing image: ${(input?.path as string) ?? "unknown"}`,
});

const generateImage: HintBuilder = (input, result) => ({
  text: `Generating image: ${(result?.path as string) ?? (input?.outputPath as string) ?? "unknown"}`,
});

const generateSpeech: HintBuilder = (input, result) => ({
  text: `Generating audio: ${(result?.path as string) ?? (input?.outputPath as string) ?? "unknown"}`,
});

export const mediaHints: Record<string, HintBuilder> = {
  [ToolName.ViewImage]: viewImage,
  [ToolName.GenerateImage]: generateImage,
  [ToolName.GenerateSpeech]: generateSpeech,
};
