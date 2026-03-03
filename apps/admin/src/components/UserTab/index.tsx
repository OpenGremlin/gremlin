import { NavLink, useParams } from "react-router-dom";
import { AIModelsPage } from "./AIModelsPage";
import { IntegrationsPage } from "./IntegrationsPage";
import { NotificationsPage } from "./NotificationsPage";
import { ProfilePage } from "./ProfilePage";
import { SkillsPage } from "./SkillsPage";

const pills = [
  { label: "Notifications", slug: "notifications" },
  { label: "AI Models", slug: "aimodels" },
  { label: "Integrations", slug: "integrations" },
  { label: "Skills", slug: "skills" },
  { label: "Profile", slug: "profile" },
] as const;
type PillSlug = (typeof pills)[number]["slug"];

export function UserTab() {
  const { pill } = useParams<{ pill: string }>();
  const active: PillSlug =
    pills.find((p) => p.slug === pill)?.slug ?? "notifications";

  return (
    <div>
      <div className="flex gap-2 px-4 pt-4 pb-4 overflow-x-auto scrollbar-hide">
        {pills.map((p) => (
          <NavLink
            key={p.slug}
            to={`/user/${p.slug}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === p.slug
                ? "bg-indigo-500 text-white"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {p.label}
          </NavLink>
        ))}
      </div>

      {active === "notifications" && <NotificationsPage />}
      {active === "aimodels" && <AIModelsPage />}
      {active === "integrations" && <IntegrationsPage />}
      {active === "skills" && <SkillsPage />}
      {active === "profile" && <ProfilePage />}
    </div>
  );
}
