Okay, let's write a requirement/design doc together under /docs/skills-design.md

Purpose

The purpose of this is to outline how we are approaching CLI based skills for Gremlin's agents.

Agentic systems are moving towards CLI-based task execution for more flexibility and inference token efficiency. We are building a system to make this process safer, more structured, and more observable. We give the user fine grain control over their authentication and minimize the surface risk for auth tokens. There is an existing set of agentic skills standards that we want to draw inspiration from. We should make our skills compatible, but extend beyond the spec to accomplish what we need.

Some references

Agent skills
https://agentskills.io/specification
OpenClaw skills (based on agent skills)
https://docs.openclaw.ai/tools/skills

Skill Files

The skills specs above are file-based and define YAML frontmatter. The frontmatter contains metadata about the skill. This is
equivalent to our skill templates. I want to convert to a file-based system so A) we are closer to the standard and B) its more practical to edit skills as markdown files and can support multiple files and supplemental folders that would be hard to do as JSON. C) agent skills support executables which we could consider later. In our frontmatter, we want:

* basic metadata - id, name, description, version (things in there already)
* requiredConnections (already there)
* install - Docker-like installation (installing dependencies should be procedural and reproducible)

Where should the skills files live?
How do existing CLI-centric agents read skills? Directly from file system or from tool calls?

---

Overview

Skills are assigned directly to agents, not installed globally. When assigning a skill, user must select a connection if the skill calls for it.

When an agent's task lane runs, its given all the available skills in the context. We have to figure out how to give the agent the ability to load all the skill assets. For now, let's start simple and just have a SKILLS.md per skill. When an agent decides to use a skill, it gets initialized. This means the appropriate enviornment variables get mounted (access tokens are refreshed if necessary), and the installation instruction runs. If there's an error in this process (connection was disconnected, install produced an error, access token could not be refreshed, etc), the agent is notified. This process should be transparent to the agent. If while using the skill, the token expires, the agent should be able to make a tool call to refresh the token.

---

Server

To get a list of SkillTemplates, GraphQL should read the Frontmatter from the skill file, to list available tools. We can do a short-lived (1 minute in-memory cache) so we don't have to rescan the folder every time. For now, if there's a parsing error, just skip the tool and log an error.

The Agent in the task lane is given a list of tools in its system prompt.

---

UX

The settings/skills page is purely read only for now. Remove any install settings.

On the agent config page, there should be a section to add skills. When adding a skill, the user selects connections if necessary.
