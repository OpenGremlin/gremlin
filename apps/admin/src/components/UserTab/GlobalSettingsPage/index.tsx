import { useState } from "react";
import { gql } from "../../../auth";
import {
  GlobalSettingsQuery,
  UpdateGlobalSettingsMutation,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useTitle } from "../../../hooks/useTitle";
import { QueryResult } from "../../../shared/QueryResult";
import { SavedIndicator } from "../../../shared/SavedIndicator";

export function GlobalSettingsPage() {
  useTitle("Global Settings");
  const { data, loading, error, refetch } = useQuery(GlobalSettingsQuery);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const settings = data?.globalSettings;

  async function toggleSignupDisabled() {
    setSaving(true);
    try {
      await gql(UpdateGlobalSettingsMutation, {
        signupDisabled: !settings?.signupDisabled,
      });
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-100">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Global settings for your Gremlin instance.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <p className="text-sm font-medium text-neutral-100">Disable signup</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Prevent new users from creating accounts. Existing users are not
            affected.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <SavedIndicator />}
          <button
            type="button"
            onClick={toggleSignupDisabled}
            disabled={saving}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              settings?.signupDisabled ? "bg-indigo-600" : "bg-neutral-700"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                settings?.signupDisabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
