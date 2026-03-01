import { NavLink, Outlet } from "react-router-dom";
import { AlignLeft, Calendar, Star, User } from "lucide-react";
import type { Notification } from "../types";
import { useQuery } from "../useQuery";
import { NOTIFICATIONS_QUERY } from "../queries";

const tabs = [
  { to: "/feed", label: "Home", icon: AlignLeft },
  { to: "/scheduler", label: "Scheduler", icon: Calendar },
  { to: "/agents", label: "Agents", icon: Star },
  { to: "/user", label: "User", icon: User },
];

export function TabShell() {
  const { data } =
    useQuery<{ notifications: Notification[] }>(NOTIFICATIONS_QUERY);
  const pendingCount =
    data?.notifications?.filter((n) => n.status === "PENDING").length ?? 0;

  return (
    <div className="flex flex-col h-dvh bg-neutral-950 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto">
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
              {tab.to === "/user" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold leading-none min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
                  {pendingCount}
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
