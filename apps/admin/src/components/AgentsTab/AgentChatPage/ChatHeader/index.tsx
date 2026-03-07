import { Undo2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { AgentQuery } from "../../../../graphql/generated/graphql";
import { TaskQuery } from "../../../../graphql/queries";
import { AgentAvatar } from "../../../../shared/AgentAvatar";
import { useQuery } from "../../../../useQuery";

type Agent = NonNullable<AgentQuery["agent"]>;

export function ChatHeader({
  agent,
  taskId,
}: {
  agent: Agent;
  taskId?: string;
}) {
  const { data } = useQuery(TaskQuery, { id: taskId ?? "" });
  const task = data?.task;
  const [imgError, setImgError] = useState(false);

  const hasTask = taskId && task?.title;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex flex-col">
      <div
        className={`flex items-center px-2 py-2 transition-all duration-300 ease-out overflow-hidden ${hasTask ? "max-h-20 opacity-100" : "max-h-0 opacity-0 py-0"}`}
        style={{
          background: `
            radial-gradient(ellipse 140% 100% at 0% 100%, rgba(79,70,229,0.45) 0%, transparent 50%),
            radial-gradient(ellipse 100% 140% at 100% 0%, rgba(168,85,247,0.3) 0%, transparent 50%),
            linear-gradient(140deg, rgb(8,10,28) 0%, rgb(25,8,55) 50%, rgb(40,8,48) 100%)
          `,
        }}
      >
        {task?.imageUrl && !imgError && (
          <img
            src={task.imageUrl}
            alt=""
            className="w-8 h-8 ml-1.5 mr-2.5 object-contain"
            onError={() => setImgError(true)}
          />
        )}
        <span className="text-indigo-200 flex-1 min-w-0 line-clamp-2">
          <span className="font-bold">Task:</span> {task?.title}
        </span>
        <Link
          to={`/agents/${agent.id}`}
          className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-indigo-100 transition-colors px-2"
        >
          Main Chat <Undo2 size={12} />
        </Link>
      </div>
      <Link
        to={taskId ? `/agents/${agent.id}` : `/agents/${agent.id}/config`}
        className="pt-4 pb-3 flex flex-col items-center border-b border-neutral-800/60 bg-neutral-950/70 backdrop-blur-md hover:bg-neutral-900/50 transition-colors"
      >
        <AgentAvatar id={agent.id} size={64} />
        <h1 className="text-sm font-semibold text-neutral-100 mt-2">
          {agent.name}
        </h1>
      </Link>
    </div>
  );
}
