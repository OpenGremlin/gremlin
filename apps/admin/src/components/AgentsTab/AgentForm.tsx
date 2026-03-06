import { useState } from "react";
import { useForm } from "react-hook-form";
import { AutoTextarea } from "../../shared/AutoTextarea";
import { SavedIndicator } from "../../shared/SavedIndicator";

export interface AgentFormValues {
  id: string;
  name: string;
  soul: string;
}

interface AgentFormProps {
  defaultValues?: AgentFormValues;
  onSubmit: (values: AgentFormValues) => Promise<void>;
  submitLabel: string;
  isAlwaysVisible?: boolean;
  isNew?: boolean;
}

export function AgentForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isAlwaysVisible,
  isNew,
}: AgentFormProps) {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, isSubmitting },
  } = useForm<AgentFormValues>({
    defaultValues: defaultValues ?? { id: "", name: "", soul: "" },
  });

  async function handleFormSubmit(values: AgentFormValues) {
    await onSubmit(values);
    if (!isAlwaysVisible) {
      reset(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const showButton = isAlwaysVisible || isDirty;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="flex items-center gap-2">
        <label htmlFor="id-field" className="text-xs text-neutral-500 shrink-0">
          ID:
        </label>
        {isNew ? (
          <input
            id="id-field"
            {...register("id", {
              required: true,
              onChange: (e) => {
                setValue("id", e.target.value.toLowerCase(), {
                  shouldDirty: true,
                });
              },
            })}
            className="flex-1 bg-neutral-900 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors font-mono"
            placeholder="my-agent"
          />
        ) : (
          <span className="text-sm text-neutral-400 font-mono">
            {defaultValues?.id}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name-field" className="text-xs text-neutral-500">
          Name
        </label>
        <input
          id="name-field"
          {...register("name", { required: true })}
          className="w-full bg-neutral-900 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="soul-field" className="text-xs text-neutral-500">
          Soul
        </label>
        <AutoTextarea
          id="soul-field"
          {...register("soul")}
          minRows={3}
          className="w-full bg-neutral-900 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 outline-none border border-neutral-800 focus:border-neutral-700 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        {showButton && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? `${submitLabel === "Save" ? "Saving" : "Creating"}…` : submitLabel}
          </button>
        )}
        {saved && <SavedIndicator />}
      </div>
    </form>
  );
}
