import { createPubSub } from "@graphql-yoga/subscription";
import type { PubSubEvents } from "@gremlin/lib/resources/pubsub.js";

export const pubsub = createPubSub<PubSubEvents>();
