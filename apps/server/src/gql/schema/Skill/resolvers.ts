import type {
  MutationResolvers,
  QueryResolvers,
  SkillResolvers,
} from "../../resolverTypes.js";
import { providers } from "../../../services/integrations/providers.js";
import { parseConnectionBindings } from "../../../services/skills/parseConnectionBindings.js";
import { getSkillDef } from "../../../services/skills/skillCatalog.js";

// --- Queries ---

const skills: QueryResolvers["skills"] = (_parent, _args, ctx) =>
  ctx.services.skills.getSkills(ctx);

const skill: QueryResolvers["skill"] = (_parent, { id }, ctx) =>
  ctx.services.skills.getSkill(ctx, id);

const searchSkills: QueryResolvers["searchSkills"] = (
  _parent,
  { query },
  ctx,
) => ctx.services.skills.searchSkills(ctx, query);

// --- Mutations ---

const installSkill: MutationResolvers["installSkill"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.skills.installSkill(ctx, id);

const uninstallSkill: MutationResolvers["uninstallSkill"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.skills.uninstallSkill(ctx, id);

const bindSkillConnection: MutationResolvers["bindSkillConnection"] = (
  _parent,
  { skillId, providerId, connectionId },
  ctx,
) => ctx.services.skills.bindSkillConnection(ctx, skillId, providerId, connectionId);

const setSkillMcpEnabled: MutationResolvers["setSkillMcpEnabled"] = (
  _parent,
  { skillId, enabled },
  ctx,
) => ctx.services.skills.setSkillMcpEnabled(ctx, skillId, enabled);

// --- Field resolvers ---

const providerMap = new Map(providers.map((p) => [p.id, p]));

const Skill: SkillResolvers = {
  hasInstructions: (parent) => {
    const def = getSkillDef(parent.id);
    return !!def?.instructions;
  },

  hasMcp: (parent) => {
    const def = getSkillDef(parent.id);
    return !!def?.mcp;
  },

  requiredConnections: async (parent, _args, ctx) => {
    const def = getSkillDef(parent.id);
    if (!def?.requiredConnections?.length) return [];

    const bindings = parseConnectionBindings(parent.connectionBindings);

    // Load connections to check validity
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connectionSet = new Set(
      connections
        .filter((c) => !c.isRevoked)
        .map((c) => c.id),
    );

    return def.requiredConnections.map((req) => {
      const boundId = bindings[req.providerId] ?? null;
      const provider = providerMap.get(req.providerId);
      return {
        providerId: req.providerId,
        providerName: provider?.service ?? req.providerId,
        reason: req.reason,
        optional: req.optional ?? false,
        boundConnectionId: boundId,
        connected: boundId != null && connectionSet.has(boundId),
      };
    });
  },
};

export const skillResolvers = {
  Query: { skills, skill, searchSkills },
  Mutation: { installSkill, uninstallSkill, bindSkillConnection, setSkillMcpEnabled },
  Skill,
};
