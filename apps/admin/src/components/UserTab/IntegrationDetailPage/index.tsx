import { useParams } from "react-router-dom";
import { INTEGRATION_QUERY } from "../../../queries";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Integration } from "../../../types";
import { useQuery } from "../../../useQuery";

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{
    integration: Integration | null;
  }>(INTEGRATION_QUERY, { id });

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const integration = data?.integration ?? null;

  if (!integration) {
    return <NotFound label="Integration not found." />;
  }

  return (
    <div className="px-4 pt-6 pb-6">
      <BackButton />

      <div className="mt-4 flex items-center gap-4">
        <span className="text-5xl">{integration.icon}</span>
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {integration.service}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {integration.account}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Connected {formatDate(integration.connectedAt)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-neutral-100 mb-3">
          Permissions
        </h2>
        <div className="flex flex-col gap-2">
          {integration.permissions.map((perm) => (
            <div
              key={perm.scope}
              className="flex items-center justify-between bg-neutral-900 rounded-xl p-4"
            >
              <span className="text-sm text-neutral-100">{perm.label}</span>
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    perm.enabled ? "bg-green-400" : "bg-neutral-600"
                  }`}
                />
                <span className="text-neutral-400">
                  {perm.enabled ? "Enabled" : "Disabled"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
