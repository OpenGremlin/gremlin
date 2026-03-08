export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  inputCost?: number | null;
  outputCost?: number | null;
}

export function ModelCard({
  model,
  isDefault,
  actions,
  className,
}: {
  model: ModelInfo;
  isDefault: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between bg-neutral-900 rounded-xl p-4 ${
        isDefault ? "ring-1 ring-indigo-500/50" : ""
      } ${className ?? ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-100">
            {model.name}
          </span>
          {model.reasoning && (
            <span className="text-[10px] font-medium bg-violet-500/20 text-violet-400 rounded px-1.5 py-0.5">
              Reasoning
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-neutral-500">
            {(model.contextWindow / 1000).toFixed(0)}k context
          </span>
          {model.inputCost != null && (
            <span className="text-xs text-neutral-500">
              ${model.inputCost}/M in
            </span>
          )}
          {model.outputCost != null && (
            <span className="text-xs text-neutral-500">
              ${model.outputCost}/M out
            </span>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
