import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  Observable,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import {
  getMainDefinition,
  relayStylePagination,
} from "@apollo/client/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistCache } from "apollo3-cache-persist";
import { createClient } from "graphql-ws";
import { clearToken, getToken, getTokenSync, refreshSession } from "./auth";
import { getApiUrl } from "./config";
import { clientLogger } from "./logger";
import { reportConnectivity } from "./networkState";
import { ReconnectTracker } from "./reconnectTracker";

// ── Reconnect tracker (re-exported for useWsReconnect) ─────────────

export const reconnectTracker = new ReconnectTracker();

// ── Cache ───────────────────────────────────────────────────────────

export const cache = new InMemoryCache({
  possibleTypes: {
    Attachment: ["FileAttachment", "LinkAttachment"],
    FileRender: [
      "ImageRender",
      "DocumentRender",
      "CodeRender",
      "AudioRender",
      "VideoRender",
      "UnknownRender",
    ],
    ConnectionMeta: [
      "OAuthConnectionMeta",
      "ApiKeyConnectionMeta",
      "AwsIamRoleConnectionMeta",
    ],
  },
  typePolicies: {
    Query: {
      fields: {
        agentLogs: relayStylePagination(["agentId"]),
        taskLogs: relayStylePagination(["taskId"]),
        tasks: relayStylePagination(),
      },
    },
    Task: {
      fields: {
        logs: relayStylePagination(),
      },
    },

    // Entities with non-standard keys
    File: { keyFields: ["path"] },
    AgentSkill: { keyFields: ["skillId", "agentId"] },
    EnabledModelEntry: { keyFields: ["providerId", "modelId"] },
    Document: { keyFields: ["path"] },
    WorkspaceEntry: { keyFields: ["path"] },

    // Singletons
    Profile: { keyFields: [] },
    GlobalSettings: { keyFields: [] },

    // Not normalized (no unique key or embedded objects)
    DefaultModel: { keyFields: false },
    AllowlistEntry: { keyFields: false },
    // Embedded config subtrees: always replace on write so stale fields
    // (e.g. removed in a newer schema) don't linger in the persisted cache,
    // and Apollo doesn't warn about ambiguous merges.
    AgentConfig: { keyFields: false, merge: false },
    AgentModelConfig: { keyFields: false, merge: false },
    AgentSandboxConfig: { keyFields: false, merge: false },
    AgentWebSearchConfig: { keyFields: false, merge: false },
    AgentReasoningConfig: { keyFields: false, merge: false },
    AgentViewImageConfig: { keyFields: false, merge: false },
    AgentImageGenerationConfig: { keyFields: false, merge: false },
    SendMessageResult: { keyFields: false },
    FileUploadUrl: { keyFields: false },
    CompletedFileUpload: { keyFields: false },
    ConnectApiKeyResult: { keyFields: false },
    AvailableScope: { keyFields: false },
    OAuthPlatformOverride: { keyFields: false },
    SkillConnectionRequirement: { keyFields: false },
    SkillConnectionStatus: { keyFields: false },
    UserInputRequestAction: { keyFields: false },
    FileAttachment: { keyFields: false, merge: false },
    LinkAttachment: { keyFields: false, merge: false },
    AgentStreamDelta: { keyFields: false },
    SandboxOutput: { keyFields: false },
    OAuthConnectionMeta: { keyFields: false },
    ApiKeyConnectionMeta: { keyFields: false },
  },
});

// ── Auth link ───────────────────────────────────────────────────────

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// ── Error link (401 → refresh → retry) ──────────────────────────────

let _onUnauthorized: (() => void) | null = null;

export function setApolloOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

const errorLink = onError(({ networkError, operation, forward }) => {
  if (
    networkError &&
    "statusCode" in networkError &&
    networkError.statusCode === 401
  ) {
    clientLogger.warn("Apollo 401, attempting token refresh");

    return new Observable((observer) => {
      refreshSession()
        .then((refreshed) => {
          if (!refreshed) {
            clientLogger.warn("Token refresh failed, logging out");
            clearToken();
            _onUnauthorized?.();
            observer.error(networkError);
            return;
          }

          // Retry the operation with the new token
          const subscriber = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
          return () => subscriber.unsubscribe();
        })
        .catch((err) => {
          clientLogger.error("Token refresh error", {
            error: err instanceof Error ? err.message : String(err),
          });
          observer.error(networkError);
        });
    });
  }
});

// ── Connectivity reporting ──────────────────────────────────────────

const connectivityLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((result) => {
    reportConnectivity(true);
    return result;
  });
});

// ── HTTP link ───────────────────────────────────────────────────────

const httpLink = new HttpLink({
  uri: () => `${getApiUrl()}/graphql`,
});

// ── WebSocket link ──────────────────────────────────────────────────

let _wsClient: ReturnType<typeof createClient> | null = null;

export function getWsClient() {
  if (_wsClient) return _wsClient;

  clientLogger.info("Initializing Apollo WebSocket client", {
    url: "/graphql",
  });

  _wsClient = createClient({
    url: () => {
      const wsUrl = `${getApiUrl().replace(/^http/, "ws")}/graphql`;
      clientLogger.info("WebSocket connecting", { url: wsUrl });
      return wsUrl;
    },
    connectionParams: () => {
      const token = getTokenSync();
      return token ? { token } : {};
    },
    retryAttempts: Number.POSITIVE_INFINITY,
    shouldRetry: () => true,
    retryWait: async (retries) => {
      const delay = Math.min(1000 * 2 ** retries, 30_000);
      clientLogger.warn("WebSocket reconnecting", {
        attempt: retries + 1,
        delayMs: delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
    on: {
      connected: () => {
        clientLogger.info("WebSocket connected");
        reconnectTracker.handleConnected();
      },
      closed: (event) =>
        clientLogger.warn("WebSocket closed", {
          code: (event as { code?: number })?.code,
          reason: (event as { reason?: string })?.reason,
        }),
      error: (error) =>
        clientLogger.error("WebSocket error", {
          message: String(error),
        }),
    },
  });

  return _wsClient;
}

const wsLink = new GraphQLWsLink(getWsClient());

// ── Split link (subscriptions → WS, everything else → HTTP) ────────

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  ApolloLink.from([connectivityLink, authLink, errorLink, httpLink]),
);

// ── Client ──────────────────────────────────────────────────────────

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});

// ── Query/mutation helper (drop-in replacement for gql()) ───────────

/**
 * Execute a GraphQL operation through Apollo's link chain and cache.
 * Same return type as the old `gql()` function for easy migration.
 */
export async function execute<
  TResult,
  TVariables extends Record<string, unknown>,
>(
  mutation: import("@graphql-typed-document-node/core").TypedDocumentNode<
    TResult,
    TVariables
  >,
  variables: TVariables,
): Promise<TResult> {
  const { data } = await apolloClient.mutate({
    mutation,
    variables,
  });
  if (!data) throw new Error("Mutation returned no data");
  return data;
}

// ── Initialization (cache hydration from disk) ──────────────────────

// Bump this version whenever the GraphQL schema or cache typePolicies
// change to avoid hydrating a stale persisted cache that can cause
// circular-reference crashes (TypeError: cyclical structure in JSON object).
const CACHE_SCHEMA_VERSION = "1";
const CACHE_VERSION_KEY = "apollo_cache_schema_version";
const CACHE_STORAGE_KEY = "apollo-cache-persist";

let _initPromise: Promise<void> | null = null;

export function initApollo(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // AsyncStorage requires native modules — skip persistence on web
    // and in environments where the native module isn't available.
    try {
      // Quick probe: if the module is null this will throw immediately
      await AsyncStorage.getItem("__apollo_cache_probe__");
    } catch {
      clientLogger.warn("AsyncStorage unavailable, skipping cache persistence");
      return;
    }

    // Clear persisted cache if schema version changed to prevent stale
    // cache data from causing crashes on app update.
    const storedVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CACHE_SCHEMA_VERSION) {
      clientLogger.info(
        "Cache schema version changed, clearing persisted cache",
        {
          from: storedVersion,
          to: CACHE_SCHEMA_VERSION,
        },
      );
      await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
      await AsyncStorage.setItem(CACHE_VERSION_KEY, CACHE_SCHEMA_VERSION);
    }

    try {
      await persistCache({
        cache,
        storage: AsyncStorage,
        key: CACHE_STORAGE_KEY,
        maxSize: 5 * 1024 * 1024, // 5 MB
      });
    } catch (err) {
      // If cache hydration fails (e.g. corrupted data), clear it and
      // continue with an empty cache rather than crashing.
      clientLogger.warn("Cache hydration failed, clearing persisted cache", {
        error: err instanceof Error ? err.message : String(err),
      });
      await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
    }
  })().catch((err) => {
    clientLogger.error("Cache persistence init failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return _initPromise;
}
