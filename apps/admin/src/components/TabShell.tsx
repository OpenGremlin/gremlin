import { NavLink, Outlet } from "react-router-dom";
import { AlignLeft, Calendar, Sun, Star, User } from "lucide-react";

const tabs = [
  { to: "/feed", label: "Home", icon: AlignLeft },
  { to: "/scheduler", label: "Scheduler", icon: Calendar },
  { to: "/integrations", label: "Integrations", icon: Sun },
  { to: "/skills", label: "Skills", icon: Star },
  { to: "/agents", label: "Agents", icon: User },
];

export function TabShell() {
  return (
    <div className="flex flex-col h-dvh bg-neutral-950 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <nav className="flex items-center justify-around border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] pt-2 pb-2">
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
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
