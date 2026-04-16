import type { LanguageModel } from "ai";
import type { ServiceContext } from "../../../context.js";
import { getModelResult } from "./getModelResult.js";

export async function getModel(ctx: ServiceContext): Promise<LanguageModel> {
  const result = await getModelResult(ctx);
  return result.model;
}
