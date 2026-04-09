import type { AvatarResolvers, QueryResolvers } from "../../resolverTypes.js";

export interface AvatarModel {
  id: string;
  name: string;
  path: string;
}

const avatarList: AvatarModel[] = [
  "Aaron",
  "Alex",
  "Alister",
  "Angela",
  "Anthony",
  "Antoine",
  "Axel",
  "Barnum",
  "Ben-and-Harry",
  "Bill",
  "Bramrack",
  "Buttercup",
  "Carl",
  "Chad",
  "Chef",
  "Chris",
  "Clara",
  "Cleo",
  "Cortez",
  "Craig",
  "Daisy",
  "Dan",
  "David",
  "Diya",
  "Eden",
  "Executron",
  "Fluffy",
  "Forge",
  "Fred",
  "Friedrich",
  "Galahad",
  "George",
  "Hammil",
  "Hello",
  "Horace",
  "Isabella",
  "Jamie",
  "Jasper",
  "Jimmy",
  "Joe",
  "Johnny",
  "June",
  "Kai",
  "Karen",
  "Katy",
  "Lakshmi",
  "Leo",
  "Link",
  "Lisa",
  "Lisabeth",
  "Liu",
  "Lucian",
  "Luke",
  "Malik",
  "Marlon",
  "Marooni",
  "Marshall",
  "Marvin",
  "Midas",
  "Miles",
  "Ming-Tien",
  "Mira-Sisters",
  "Momo",
  "Monty",
  "Mort",
  "Motherboard",
  "Nibbles",
  "Nova",
  "Nyarlath",
  "Oliver",
  "Parker",
  "Pollyanna",
  "Qubit",
  "Ramu",
  "Randalph",
  "Reginald",
  "Roxy",
  "Rubin",
  "Rusty",
  "Sabrina",
  "Sera",
  "Shandra",
  "Shelby",
  "Sheldon",
  "Smithers",
  "Snowball",
  "Soylent-Green",
  "Stjarni",
  "Stormy",
  "Switch",
  "Todd",
  "Tom",
  "Trevor",
  "Willow",
  "Willy",
  "Xandria",
  "Zahim",
  "Zane",
  "Zara",
].map((name) => ({
  id: name.toLowerCase(),
  name: name.replace(/-/g, " "),
  path: `/avatars/${name}.png`,
}));

const avatarMap = new Map(avatarList.map((a) => [a.id, a.path]));

export function avatarPathById(id: string): string | undefined {
  return avatarMap.get(id);
}

const avatars: QueryResolvers["avatars"] = () => avatarList;

const url: AvatarResolvers["url"] = (parent, args, ctx) =>
  ctx.services.media.buildMediaUrl(ctx.mediaBaseUrl, parent.path, args.width);

export const avatarResolvers = {
  Query: { avatars },
  Avatar: { url },
};
