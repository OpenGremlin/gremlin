import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { gql } from "../../../auth";
import { PROFILE_QUERY, UPDATE_PROFILE } from "../../../queries";
import { AutoTextarea } from "../../../shared/AutoTextarea";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

interface ProfileFormValues {
  displayName: string;
  about: string;
  website: string;
}

export function ProfilePage() {
  const { data, loading, error } = useQuery<{
    profile: {
      displayName: string;
      about: string;
      website: string | null;
    };
  }>(PROFILE_QUERY);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>();

  const profile = data?.profile;

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        about: profile.about,
        website: profile.website ?? "",
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    await gql(UPDATE_PROFILE, {
      input: {
        displayName: values.displayName,
        about: values.about,
        website: values.website || null,
      },
    });
    reset(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 px-4 pb-6"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="profile-displayName"
          className="text-xs text-neutral-500"
        >
          Display Name
        </label>
        <input
          id="profile-displayName"
          {...register("displayName")}
          className="w-full bg-neutral-900 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="profile-about" className="text-xs text-neutral-500">
          About
        </label>
        <AutoTextarea
          id="profile-about"
          {...register("about")}
          minRows={3}
          className="w-full bg-neutral-900 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="profile-website" className="text-xs text-neutral-500">
          Website
        </label>
        <input
          id="profile-website"
          {...register("website")}
          type="url"
          placeholder="https://"
          className="w-full bg-neutral-900 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
        />
      </div>

      <div className="flex items-center gap-3">
        {isDirty && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Check size={14} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
