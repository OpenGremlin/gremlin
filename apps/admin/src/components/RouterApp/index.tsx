import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FeedDetailPage } from "../feed/FeedDetailPage";
import { FeedPage } from "../feed/FeedPage";
import { IntegrationDetailPage } from "../integrations/IntegrationDetailPage";
import { IntegrationsPage } from "../integrations/IntegrationsPage";
import { SchedulerPage } from "../scheduler/SchedulerPage";
import { JobDetailPage } from "../scheduler/JobDetailPage";
import { AgentDetailPage } from "../agents/AgentDetailPage";
import { AgentsPage } from "../agents/AgentsPage";
import { SkillDetailPage } from "../skills/SkillDetailPage";
import { SkillsPage } from "../skills/SkillsPage";
import { TabShell } from "../TabShell";

export function RouterApp() {
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
          <Route
            path="integrations/:id"
            element={<IntegrationDetailPage />}
          />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:id" element={<AgentDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
