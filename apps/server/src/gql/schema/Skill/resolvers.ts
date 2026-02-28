import type {
  MutationResolvers,
  QueryResolvers,
  Skill,
} from "../../resolverTypes.js";

const mockSkills: Skill[] = [
  {
    id: "1",
    name: "Web Search",
    description: "Search the web and return summarized results",
    version: "1.2.0",
    author: "gremlin-core",
    installed: true,
    category: "research",
    homepage: "https://github.com/gremlin/skills-web-search",
    requiredEnv: ["SEARCH_API_KEY"],
  },
  {
    id: "2",
    name: "Code Review",
    description: "Analyze code changes and provide review feedback",
    version: "0.9.1",
    author: "gremlin-core",
    installed: true,
    category: "development",
    homepage: "https://github.com/gremlin/skills-code-review",
    requiredEnv: [],
  },
  {
    id: "3",
    name: "Email Drafter",
    description: "Draft and format email responses",
    version: "1.0.0",
    author: "community",
    installed: false,
    category: "communication",
    homepage: null,
    requiredEnv: ["SMTP_HOST", "SMTP_USER"],
  },
  {
    id: "4",
    name: "Calendar Sync",
    description: "Sync and manage calendar events across providers",
    version: "2.1.0",
    author: "community",
    installed: false,
    category: "productivity",
    homepage: "https://github.com/gremlin-community/calendar-sync",
    requiredEnv: ["GOOGLE_CALENDAR_API_KEY"],
  },
];

const skills: QueryResolvers["skills"] = () => mockSkills;

const skill: QueryResolvers["skill"] = (_parent, { id }) =>
  mockSkills.find((s) => s.id === id) ?? null;

const searchSkills: QueryResolvers["searchSkills"] = (_parent, { query }) => {
  const q = query.toLowerCase();
  return mockSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
};

const installSkill: MutationResolvers["installSkill"] = (_parent, { id }) => {
  const s = mockSkills.find((s) => s.id === id);
  if (!s) throw new Error(`Skill ${id} not found`);
  s.installed = true;
  return s;
};

const uninstallSkill: MutationResolvers["uninstallSkill"] = (
  _parent,
  { id },
) => {
  const s = mockSkills.find((s) => s.id === id);
  if (!s) throw new Error(`Skill ${id} not found`);
  s.installed = false;
  return s;
};

export const skillResolvers = {
  Query: { skills, skill, searchSkills },
  Mutation: { installSkill, uninstallSkill },
};
