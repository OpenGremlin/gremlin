import { NavLink, useParams } from "react-router-dom";
import { IntegrationsPage } from "./IntegrationsPage";
import { NotificationsPage } from "./NotificationsPage";
import { ProfilePage } from "./ProfilePage";
import { SkillsPage } from "./SkillsPage";

const pills = ["Notifications", "Integrations", "Skills", "Profile"] as const;
type Pill = (typeof pills)[number];

export function UserTab() {
  const { pill } = useParams<{ pill: string }>();
  const active: Pill =
    pills.find((p) => p.toLowerCase() === pill) ?? "Notifications";

  return (
    <div>
      <div className="flex gap-2 px-4 pt-4 pb-4 overflow-x-auto scrollbar-hide">
        {pills.map((p) => (
          <NavLink
            key={p}
            to={`/user/${p.toLowerCase()}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === p
                ? "bg-indigo-500 text-white"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {p}
          </NavLink>
        ))}
      </div>

      {active === "Notifications" && <NotificationsPage />}
      {active === "Integrations" && <IntegrationsPage />}
      {active === "Skills" && <SkillsPage />}
      {active === "Profile" && <ProfilePage />}
    </div>
  );
}
