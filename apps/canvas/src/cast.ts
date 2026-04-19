// Cast Application Framework (CAF) receiver bootstrap. Runs once on page
// load. When the page is loaded inside a Cast device, this hands the
// session lifecycle to CAF and opens a custom message channel for the
// sender app (mobile) to push commands. Outside a Cast device — e.g. a
// regular browser tab during development — this is a no-op.

// Namespace for sender ↔ receiver messages. Must start with "urn:x-cast:"
// and is what the mobile sender uses when calling
// CastSession.sendMessage(NAMESPACE, payload).
const NAMESPACE = "urn:x-cast:com.opengremlin.canvas";

declare global {
  interface Window {
    cast?: {
      framework: {
        CastReceiverContext: {
          getInstance(): {
            addCustomMessageListener(
              namespace: string,
              handler: (event: { data: unknown }) => void,
            ): void;
            start(): void;
          };
        };
      };
    };
  }
}

export function bootstrapCast(): void {
  // Outside a Cast device cast.framework is undefined — the page renders
  // as a normal SPA in any browser tab.
  const framework = window.cast?.framework;
  if (!framework) return;

  const context = framework.CastReceiverContext.getInstance();

  // Placeholder. The real agent → canvas protocol will live on its own
  // WebSocket; sender messages here are reserved for session control
  // (auth handoff, focus changes, etc.).
  context.addCustomMessageListener(NAMESPACE, () => {});

  context.start();
}
