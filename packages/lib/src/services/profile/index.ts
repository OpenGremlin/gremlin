import { getProfile } from "./getProfile.js";
import { updateProfile } from "./updateProfile.js";

export const profileService = { getProfile, updateProfile };

export type ProfileService = typeof profileService;
