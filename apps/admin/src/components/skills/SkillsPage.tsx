import { useState } from "react";
import { Link } from "react-router-dom";
import type { Skill } from "../../types";
import { Badge } from "../../shared/Badge";
import { PageHeader } from "../../shared/PageHeader";

const skills: Skill[] = [
  {
    id: "web-research",
    name: "Web Research",
    description: "Search the web and summarize findings into concise briefs.",
    version: "1.2.0",
    author: "Gremlin Labs",
    installed: true,
    category: "research",
    homepage: "https://gremlin.dev/skills/web-research",
    requiredEnv: [],
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Analyze pull requests and surface potential issues or improvements.",
    version: "2.0.1",
    author: "Gremlin Labs",
    installed: true,
    category: "development",
    homepage: "https://gremlin.dev/skills/code-review",
    requiredEnv: [],
  },
  {
    id: "email-drafting",
    name: "Email Drafting",
    description: "Compose professional emails from short bullet-point prompts.",
    version: "1.0.3",
    author: "Gremlin Labs",
    installed: true,
    category: "communication",
    homepage: "https://gremlin.dev/skills/email-drafting",
    requiredEnv: [],
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Process CSV and JSON datasets to extract trends and insights.",
    version: "0.9.0",
    author: "Third Party Co",
    installed: false,
    category: "analytics",
    homepage: "https://thirdparty.dev/data-analysis",
    requiredEnv: ["PANDAS_API_KEY"],
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Transcribe and summarize meeting recordings into action items.",
    version: "1.1.0",
    author: "Gremlin Labs",
    installed: true,
    category: "productivity",
    homepage: "https://gremlin.dev/skills/meeting-notes",
    requiredEnv: [],
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Generate and schedule social media posts across platforms.",
    version: "0.8.2",
    author: "Third Party Co",
    installed: false,
    category: "marketing",
    homepage: "https://thirdparty.dev/social-media",
    requiredEnv: ["TWITTER_API_KEY", "LINKEDIN_TOKEN"],
  },
  {
    id: "translation",
    name: "Translation",
    description: "Translate text between 40+ languages with context-aware phrasing.",
    version: "1.3.0",
    author: "Gremlin Labs",
    installed: true,
    category: "communication",
    homepage: "https://gremlin.dev/skills/translation",
    requiredEnv: [],
  },
  {
    id: "image-description",
    name: "Image Description",
    description: "Generate detailed alt-text and captions for uploaded images.",
    version: "0.7.1",
    author: "Third Party Co",
    installed: false,
    category: "accessibility",
    homepage: null,
    requiredEnv: ["VISION_API_KEY"],
  },
  {
    id: "calendar-sync",
    name: "Calendar Sync",
    description: "Sync and manage calendar events across Google and Outlook.",
    version: "1.0.0",
    author: "Gremlin Labs",
    installed: true,
    category: "productivity",
    homepage: "https://gremlin.dev/skills/calendar-sync",
    requiredEnv: [],
  },
];

export function SkillsPage() {
  const [query, setQuery] = useState("");

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Skills" />

      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 w-full"
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {filtered.map((skill) => (
          <Link
            key={skill.id}
            to={`/skills/${skill.id}`}
            className="bg-neutral-900 rounded-xl p-4 block transition-colors hover:bg-neutral-800/60"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-100">
                {skill.name}
              </h3>
              <Badge label={skill.installed ? "Installed" : "Available"} />
            </div>
            <p className="text-xs text-neutral-400 mb-2">{skill.description}</p>
            <span className="text-[11px] text-neutral-500">
              v{skill.version}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
