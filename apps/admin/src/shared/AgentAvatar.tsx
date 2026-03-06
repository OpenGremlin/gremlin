import { AgentQuery } from "../graphql/queries";
import { useQuery } from "../useQuery";

export function AgentAvatar({ id, size = 48 }: { id: string; size?: number }) {
  const { data } = useQuery(AgentQuery, { id });
  const agent = data?.agent;
  const name = agent?.name ?? "";

  const isRetired = agent?.retired ?? false;

  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 flex items-center justify-center ${isRetired ? "grayscale opacity-50" : ""}`}
    >
      <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden text-sm text-neutral-400 font-medium">
        {agent?.imageUrl && (
          <img
            src={agent.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.textContent = name[0];
            }}
          />
        )}
      </div>
    </div>
  );
}
