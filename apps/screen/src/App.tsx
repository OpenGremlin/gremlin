import type { AvatarState } from "@gremlin/shared-types";
import { useState } from "react";
import { AmbientView } from "./components/AmbientView";
import type { ContentLayout } from "./components/ContentPane";
import { ContentPane } from "./components/ContentPane";
import type { Task } from "./components/Rail";
import { Rail } from "./components/Rail";
import { Shell } from "./components/Shell";
import { Toast } from "./components/Toast";

const mockTasks: Task[] = [
  { id: "1", label: "Search", state: "active" },
  { id: "2", label: "News", state: "attentive" },
];

export function App() {
  const [avatarState] = useState<AvatarState>("dormant");
  const [tasks] = useState<Task[]>(mockTasks);
  const [layout] = useState<ContentLayout>("single");
  const [toast] = useState<string | null>(null);

  return (
    <Shell>
      <Rail avatarState={avatarState} tasks={tasks} />
      <ContentPane
        layout={layout}
        primary={<AmbientView />}
        secondary={layout === "split" ? <AmbientView /> : undefined}
      />
      <Toast message={toast} />
    </Shell>
  );
}
