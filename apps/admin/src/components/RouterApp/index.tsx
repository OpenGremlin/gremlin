import { AlignLeft, Calendar, Star, User } from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { NOTIFICATIONS_QUERY } from "../../queries";
import type { Notification } from "../../types";
import { useQuery } from "../../useQuery";
import { AgentsTab } from "../AgentsTab";
import { AgentChatPage } from "../AgentsTab/AgentChatPage";
import { AgentConfigPage } from "../AgentsTab/AgentConfigPage";
import { TaskThreadPage } from "../TaskThreadPage";
import { FeedTab } from "../FeedTab";
import { SchedulerTab } from "../SchedulerTab";
import { JobDetailPage } from "../SchedulerTab/JobDetailPage";
import { UserTab } from "../UserTab";
import { IntegrationDetailPage } from "../UserTab/IntegrationDetailPage";
import { SkillDetailPage } from "../UserTab/SkillDetailPage";

function TabShell() {
  const { data } = useQuery<{ notifications: Notification[] }>(
    NOTIFICATIONS_QUERY,
  );
  const pendingCount =
    data?.notifications?.filter((n) => n.status === "PENDING").length ?? 0;

  const tabs = [
    { to: "/feed", label: "Home", icon: AlignLeft, badge: 0 },
    { to: "/scheduler", label: "Scheduler", icon: Calendar, badge: 0 },
    { to: "/agents", label: "Agents", icon: Star, badge: 0 },
    {
      to: "/user/notifications",
      label: "User",
      icon: User,
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex flex-col h-dvh bg-neutral-950 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>
      <nav className="flex items-center justify-around border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-sm pt-2 pb-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[11px] px-3 py-1 transition-colors ${
                isActive ? "text-indigo-400" : "text-neutral-500"
              }`
            }
          >
            <span className="relative">
              <tab.icon size={20} />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold leading-none min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
                  {tab.badge}
                </span>
              )}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TabShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedTab />} />
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
          <Route path="tasks/:taskId" element={<TaskThreadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
