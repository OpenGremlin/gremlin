import {
  Bot,
  Calendar,
  FolderOpen,
  Home,
  Plug,
  Settings,
  User,
  Wand2,
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AgentsTab } from "../AgentsTab";
import { FilesTab } from "../FilesTab";
import { FileViewPage } from "../FilesTab/FileViewPage";
import { AgentChatPage } from "../AgentsTab/AgentChatPage";
import { AgentConfigPage } from "../AgentsTab/AgentConfigPage";
import { SchedulerTab } from "../SchedulerTab";
import { JobDetailPage } from "../SchedulerTab/JobDetailPage";
import { NewJobPage } from "../SchedulerTab/NewJobPage";
import { TasksTab } from "../TasksTab";
import { TaskThreadPage } from "../TaskThreadPage";

import { ConnectionDetailPage } from "../UserTab/ConnectionDetailPage";
import { IntegrationDetailPage } from "../UserTab/IntegrationDetailPage";
import { IntegrationsPage } from "../UserTab/IntegrationsPage";
import { ProfilePage } from "../UserTab/ProfilePage";
import { SkillDetailPage } from "../UserTab/SkillDetailPage";
import { SkillsPage } from "../UserTab/SkillsPage";

const settingsItems = [
  { to: "/settings/scheduler", label: "Scheduler", icon: Calendar },
  { to: "/settings/files", label: "Files", icon: FolderOpen },
  { to: "/settings/integrations", label: "Connect", icon: Plug },
  { to: "/settings/skills", label: "Skills", icon: Wand2 },
  { to: "/settings/profile", label: "Profile", icon: User },
];

function AppShell() {
  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith("/settings");

  return (
    <div className="flex flex-row h-dvh bg-neutral-950">
      {/* Left icon rail */}
      <nav className="w-16 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center gap-1 pt-4">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] px-3 py-2 rounded-lg transition-colors ${
              isActive ? "text-indigo-400" : "text-neutral-500 hover:text-neutral-300"
            }`
          }
        >
          <Home size={22} />
          Home
        </NavLink>
        <NavLink
          to="/agents"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] px-3 py-2 rounded-lg transition-colors ${
              isActive ? "text-indigo-400" : "text-neutral-500 hover:text-neutral-300"
            }`
          }
        >
          <Bot size={22} />
          Agents
        </NavLink>
        <NavLink
          to="/settings/scheduler"
          className={`flex flex-col items-center gap-0.5 text-[11px] px-3 py-2 rounded-lg transition-colors ${
            isSettingsRoute ? "text-indigo-400" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Settings size={22} />
          Settings
        </NavLink>
      </nav>

      {/* Settings secondary rail */}
      {isSettingsRoute && (
        <nav className="w-16 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center gap-1 pt-4">
          {settingsItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[11px] px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-indigo-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<TasksTab />} />

          <Route path="agents" element={<AgentsTab />} />
          <Route path="agents/:id" element={<AgentChatPage />} />
          <Route path="agents/:id/config" element={<AgentConfigPage />} />

          <Route
            path="settings"
            element={<Navigate to="/settings/scheduler" replace />}
          />
          <Route path="settings/scheduler" element={<SchedulerTab />} />
          <Route path="settings/scheduler/new" element={<NewJobPage />} />
          <Route path="settings/scheduler/:id" element={<JobDetailPage />} />
          <Route path="settings/files" element={<FilesTab />} />
          <Route path="settings/files/view" element={<FileViewPage />} />
          <Route path="settings/integrations" element={<IntegrationsPage />} />
          <Route
            path="settings/integrations/:id"
            element={<IntegrationDetailPage />}
          />
          <Route path="settings/skills" element={<SkillsPage />} />
          <Route path="settings/skills/:id" element={<SkillDetailPage />} />
          <Route path="settings/profile" element={<ProfilePage />} />
          <Route
            path="settings/connections/:id"
            element={<ConnectionDetailPage />}
          />

          <Route path="tasks/:taskId" element={<TaskThreadPage />} />

          {/* Legacy redirects */}
          <Route
            path="scheduler/*"
            element={<Navigate to="/settings/scheduler" replace />}
          />
          <Route
            path="files/*"
            element={<Navigate to="/settings/files" replace />}
          />
          <Route
            path="user/*"
            element={<Navigate to="/settings/profile" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
