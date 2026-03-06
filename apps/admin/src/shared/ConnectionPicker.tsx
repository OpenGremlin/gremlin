import { Link } from "react-router-dom";
import { IntegrationLogo } from "./IntegrationLogo";

interface ConnectionOption {
  id: string;
  description: string;
  providerId: string;
  isRevoked: boolean;
}

interface ConnectionRequirement {
  providerId: string;
  providerName: string;
  optional?: boolean;
  reason: string;
}

export function ConnectionPicker({
  requirements,
  connections,
  selected,
  onSelect,
}: {
  requirements: ConnectionRequirement[];
  connections: readonly ConnectionOption[];
  selected: Record<string, string>;
  onSelect: (providerId: string, connectionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {requirements.map((req) => {
        const available = connections.filter(
          (c) => c.providerId === req.providerId && !c.isRevoked,
        );
        const selectedId = selected[req.providerId];
        return (
          <div key={req.providerId} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-100">
                {req.providerName}
              </span>
              {req.optional && (
                <span className="text-xs text-neutral-500">
                  (optional)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">{req.reason}</p>
            {available.length > 0 ? (
              <div className="flex flex-col gap-2">
                {available.map((conn) => (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => onSelect(req.providerId, conn.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedId === conn.id
                        ? "border-emerald-500 ring-2 ring-emerald-500 bg-neutral-800/50"
                        : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
                    }`}
                  >
                    <IntegrationLogo id={req.providerId} size={8} />
                    <span className="text-sm text-neutral-200">
                      {conn.description || conn.id}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                No {req.providerName} connections.{" "}
                <Link
                  to={`/settings/integrations/${req.providerId}`}
                  className="text-indigo-400 hover:underline"
                >
                  Set up a connection
                </Link>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
