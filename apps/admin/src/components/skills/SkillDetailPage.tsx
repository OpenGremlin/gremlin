import { useParams } from "react-router-dom";
import type { Skill } from "../../types";
import { Badge } from "../../shared/Badge";
import { BackButton } from "../../shared/BackButton";

const skills: Skill[] = [
  {
    id: "web-research",
    name: "Web Research",
    description:
      "Search the web and summarize findings into concise briefs. Supports multi-source cross-referencing and automatically generates citations. Ideal for market research, competitive analysis, and fact-checking tasks.",
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
    description:
      "Analyze pull requests and surface potential issues or improvements. Checks for common anti-patterns, security vulnerabilities, and style inconsistencies. Integrates with GitHub and GitLab repositories.",
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
    description:
      "Compose professional emails from short bullet-point prompts. Adjusts tone for formal, casual, or follow-up contexts automatically. Supports templates for recurring email types like invoices and introductions.",
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
    description:
      "Process CSV and JSON datasets to extract trends and insights. Generates summary statistics, visualizations, and anomaly reports. Can handle datasets up to 500 MB with streaming processing.",
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
    description:
      "Transcribe and summarize meeting recordings into action items. Identifies speakers and tags decisions versus open questions. Exports to Notion, Confluence, and plain Markdown formats.",
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
    description:
      "Generate and schedule social media posts across platforms. Optimizes posting times based on audience engagement data. Supports Twitter, LinkedIn, Instagram, and Mastodon out of the box.",
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
    description:
      "Translate text between 40+ languages with context-aware phrasing. Preserves formatting, code blocks, and markdown structure during translation. Includes glossary support for domain-specific terminology.",
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
    description:
      "Generate detailed alt-text and captions for uploaded images. Uses vision models to describe content, context, and visual composition. Supports batch processing for large media libraries.",
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
    description:
      "Sync and manage calendar events across Google and Outlook. Detects scheduling conflicts and suggests optimal meeting times. Handles timezone conversions and recurring event updates automatically.",
    version: "1.0.0",
    author: "Gremlin Labs",
    installed: true,
    category: "productivity",
    homepage: "https://gremlin.dev/skills/calendar-sync",
    requiredEnv: [],
  },
];

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const skill = skills.find((s) => s.id === id);

  if (!skill) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-400 mt-4">Skill not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <BackButton />

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">
            {skill.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge label={`v${skill.version}`} />
            <Badge label={skill.installed ? "Installed" : "Available"} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Author</span>
          <span className="text-sm text-neutral-100">{skill.author}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Category</span>
          <span className="text-sm text-neutral-100 capitalize">
            {skill.category}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Description</span>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {skill.description}
          </p>
        </div>

        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            skill.installed
              ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          {skill.installed ? "Uninstall" : "Install"}
        </button>
      </div>
    </div>
  );
}
