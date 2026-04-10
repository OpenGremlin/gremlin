import { allLogoKeys } from "@opengremlin/lib/services/media/index.js";
import type { LogoResolvers, QueryResolvers } from "../../resolverTypes.js";

export interface LogoModel {
  id: string;
  darkPath: string;
  lightPath: string;
}

const logoList: LogoModel[] = allLogoKeys.map((id) => ({
  id,
  darkPath: `/logos/${id}_dark.svg`,
  lightPath: `/logos/${id}_light.svg`,
}));

const logos: QueryResolvers["logos"] = () => logoList;

const darkUrl: LogoResolvers["darkUrl"] = (parent, args, ctx) =>
  ctx.services.media.buildMediaUrl(
    ctx.mediaBaseUrl,
    parent.darkPath,
    args.width,
  );

const lightUrl: LogoResolvers["lightUrl"] = (parent, args, ctx) =>
  ctx.services.media.buildMediaUrl(
    ctx.mediaBaseUrl,
    parent.lightPath,
    args.width,
  );

export const logoResolvers = {
  Query: { logos },
  Logo: { darkUrl, lightUrl },
};
