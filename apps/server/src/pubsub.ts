import { createPubSub } from "@graphql-yoga/subscription";
import type { PubSubEvents } from "@opengremlin/lib/resources/pubsub.js";

export const pubsub = createPubSub<PubSubEvents>();
