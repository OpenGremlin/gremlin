import type { QueryResolvers } from "../../resolverTypes.js";

export interface AvatarModel {
  id: string;
  name: string;
  path: string;
}

const avatarList: AvatarModel[] = [
  "Aaron", "Alex", "Alister", "Angela", "Anthony", "Antoine", "Axel",
  "Barnum", "Bill", "Bramrack",
  "Carl", "Chad", "Chef", "Chris", "Clara", "Cleo", "Craig",
  "Daisy", "Dan", "David", "Diya",
  "Eden", "Executron",
  "Fluffy", "Fred", "Friedrich",
  "Galahad", "George",
  "Hammil", "Horace",
  "Isabella",
  "Jamie", "Jasper", "Jimmy", "Joe", "Johnny", "June",
  "Kai", "Karen", "Katy",
  "Lakshmi", "Leo", "Link", "Lisa", "Lisabeth", "Liu", "Lucian", "Luke",
  "Malik", "Marlon", "Marooni", "Marshall", "Marvin", "Midas", "Miles",
  "Ming-Tien", "Momo", "Monty", "Mort",
  "Nibbles", "Nova", "Nyarlath",
  "Oliver",
  "Parker", "Pollyanna",
  "Qubit",
  "Ramu", "Randalph", "Reginald", "Roxy", "Rubin", "Rusty",
  "Sabrina", "Sera", "Shandra", "Smithers", "Snowball", "Stjarni", "Stormy", "Switch",
  "Todd", "Tom", "Trevor",
  "Willow", "Willy",
  "Zahim", "Zane", "Zara",
].map((name) => ({
  id: name.toLowerCase(),
  name,
  path: `/avatars/${name}.png`,
}));

const avatars: QueryResolvers["avatars"] = () => avatarList;

export const avatarResolvers = {
  Query: { avatars },
  Avatar: {
    url: (parent: AvatarModel, args: { width?: number | null }, ctx: { mediaCdnUrl: string }) => {
      const base = ctx.mediaCdnUrl.replace(/\/$/, "");
      const widthParam = args.width ? `?width=${args.width}` : "";
      return `${base}${parent.path}${widthParam}`;
    },
  },
};
