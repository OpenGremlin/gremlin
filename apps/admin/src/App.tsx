import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TabShell } from "./components/TabShell";
import { FeedDetailPage } from "./components/feed/FeedDetailPage";
import { FeedPage } from "./components/feed/FeedPage";
import { IntegrationDetailPage } from "./components/integrations/IntegrationDetailPage";
import { IntegrationsPage } from "./components/integrations/IntegrationsPage";
import { JobDetailPage } from "./components/scheduler/JobDetailPage";
import { SchedulerPage } from "./components/scheduler/SchedulerPage";
import { SkillDetailPage } from "./components/skills/SkillDetailPage";
import { SkillsPage } from "./components/skills/SkillsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TabShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="feed/:id" element={<FeedDetailPage />} />
          <Route path="scheduler" element={<SchedulerPage />} />
          <Route path="scheduler/:id" element={<JobDetailPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="integrations/:id" element={<IntegrationDetailPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
