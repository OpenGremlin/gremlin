import { dismissUserInputRequest } from "./dismissUserInputRequest.js";
import { getUserInputRequest } from "./getUserInputRequest.js";
import { getUserInputRequests } from "./getUserInputRequests.js";
import { resolveUserInputRequest } from "./resolveUserInputRequest.js";

export const userInputRequestService = {
  getUserInputRequest,
  getUserInputRequests,
  resolveUserInputRequest,
  dismissUserInputRequest,
};

export type UserInputRequestService = typeof userInputRequestService;
