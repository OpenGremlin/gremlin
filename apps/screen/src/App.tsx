import { useState } from "react";
import { AmbientView } from "./components/AmbientView";
import type { ContentLayout } from "./components/ContentPane";
import { ContentPane } from "./components/ContentPane";
import type { Task } from "./components/Rail";
import { Rail } from "./components/Rail";
import { Shell } from "./components/Shell";
import { Toast } from "./components/Toast";

const mockTasks: Task[] = [
  { id: "1", label: "Search", imageUrl: "/avatars/search.png" },
  { id: "2", label: "News", imageUrl: "/avatars/news.png" },
];

export function App() {
  const [tasks] = useState<Task[]>(mockTasks);
  const [layout] = useState<ContentLayout>("single");
  const [toast] = useState<string | null>(null);

  return (
    <Shell>
      <Rail avatarImageUrl="/avatars/main.png" tasks={tasks} />
      <ContentPane
        layout={layout}
        primary={<AmbientView />}
        secondary={layout === "split" ? <AmbientView /> : undefined}
      />
      <Toast message={toast} />
    </Shell>
  );
}
