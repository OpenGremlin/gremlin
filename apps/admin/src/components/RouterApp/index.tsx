import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AgentsTab } from "../AgentsTab";
import { AgentChatPage } from "../AgentsTab/AgentChatPage";
import { AgentConfigPage } from "../AgentsTab/AgentConfigPage";
import { FeedTab } from "../FeedTab";
import { FeedDetailPage } from "../FeedTab/FeedDetailPage";
import { SchedulerTab } from "../SchedulerTab";
import { JobDetailPage } from "../SchedulerTab/JobDetailPage";
import { TabShell } from "../TabShell";
import { UserTab } from "../UserTab";
import { IntegrationDetailPage } from "../UserTab/IntegrationDetailPage";
import { SkillDetailPage } from "../UserTab/SkillDetailPage";

export function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TabShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedTab />} />
          <Route path="feed/:id" element={<FeedDetailPage />} />
          <Route path="scheduler" element={<SchedulerTab />} />
          <Route path="scheduler/:id" element={<JobDetailPage />} />
          <Route
            path="user"
            element={<Navigate to="/user/notifications" replace />}
          />
          <Route path="user/:pill" element={<UserTab />} />
          <Route path="integrations/:id" element={<IntegrationDetailPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
          <Route path="agents" element={<AgentsTab />} />
          <Route path="agents/:id" element={<AgentChatPage />} />
          <Route path="agents/:id/config" element={<AgentConfigPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
