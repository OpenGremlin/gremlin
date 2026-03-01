import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AgentChatPage } from "../agents/AgentChatPage";
import { AgentConfigPage } from "../agents/AgentConfigPage";
import { AgentsPage } from "../agents/AgentsPage";
import { FeedDetailPage } from "../feed/FeedDetailPage";
import { FeedPage } from "../feed/FeedPage";
import { IntegrationDetailPage } from "../integrations/IntegrationDetailPage";
import { JobDetailPage } from "../scheduler/JobDetailPage";
import { SchedulerPage } from "../scheduler/SchedulerPage";
import { SkillDetailPage } from "../skills/SkillDetailPage";
import { TabShell } from "../TabShell";
import { UserPage } from "../user/UserPage";

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
          <Route path="user" element={<UserPage />} />
          <Route path="integrations/:id" element={<IntegrationDetailPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:id" element={<AgentChatPage />} />
          <Route path="agents/:id/config" element={<AgentConfigPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
