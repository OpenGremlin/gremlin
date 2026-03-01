import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/feed", label: "Home", icon: FeedIcon },
  { to: "/scheduler", label: "Scheduler", icon: SchedulerIcon },
  { to: "/integrations", label: "Integrations", icon: IntegrationsIcon },
  { to: "/skills", label: "Skills", icon: SkillsIcon },
  { to: "/agents", label: "Agents", icon: AgentsIcon },
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
            <tab.icon />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function FeedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 5h14M3 10h14M3 15h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SchedulerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="3"
        y="4"
        width="14"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 2v3M13 2v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IntegrationsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AgentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
