import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

export interface ProfileModel {
  name: string;
  displayName: string;
  about: string;
  website: string | null;
}

let currentProfile: ProfileModel = {
  name: "marvin",
  displayName: "Marvin",
  about: "Building things with AI agents.",
  website: null,
};

const profile: QueryResolvers["profile"] = () => currentProfile;

const updateProfile: MutationResolvers["updateProfile"] = (
  _parent,
  { input },
) => {
  currentProfile = {
    name: input.name,
    displayName: input.displayName,
    about: input.about,
    website: input.website ?? null,
  };
  return currentProfile;
};

export const profileResolvers = {
  Query: { profile },
  Mutation: { updateProfile },
};
