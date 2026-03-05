import type {
  MutationResolvers,
  QueryResolvers,
  SkillResolvers,
  SkillTemplateResolvers,
} from "../../resolverTypes.js";
import { providers } from "../../../services/integrations/providers.js";
import { parseConnectionBindings } from "../../../services/skills/parseConnectionBindings.js";
import {
  getSkillTemplate,
  skillCatalog,
} from "../../../services/skills/skillCatalog.js";

// --- Queries ---

const skillTemplates: QueryResolvers["skillTemplates"] = () => skillCatalog;

const skillTemplate: QueryResolvers["skillTemplate"] = (_parent, { id }) =>
  getSkillTemplate(id) ?? null;

const skills: QueryResolvers["skills"] = (_parent, _args, ctx) =>
  ctx.services.skills.getSkills(ctx);

const skill: QueryResolvers["skill"] = (_parent, { id }, ctx) =>
  ctx.services.skills.getSkill(ctx, id);

// --- Mutations ---

const installSkill: MutationResolvers["installSkill"] = (
  _parent,
  { templateId },
  ctx,
) => ctx.services.skills.installSkill(ctx, templateId);

const uninstallSkill: MutationResolvers["uninstallSkill"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.skills.uninstallSkill(ctx, id);

const bindSkillConnection: MutationResolvers["bindSkillConnection"] = (
  _parent,
  { id, providerId, connectionId },
  ctx,
) => ctx.services.skills.bindSkillConnection(ctx, id, providerId, connectionId);

const setSkillMcpEnabled: MutationResolvers["setSkillMcpEnabled"] = (
  _parent,
  { id, enabled },
  ctx,
) => ctx.services.skills.setSkillMcpEnabled(ctx, id, enabled);

// --- Field resolvers ---

const providerMap = new Map(providers.map((p) => [p.id, p]));

const SkillTemplate: SkillTemplateResolvers = {
  hasInstructions: (parent) => !!parent.instructions,
  hasMcp: (parent) => !!parent.mcp,
  requiredConnections: (parent) =>
    (parent.requiredConnections ?? []).map((req) => {
      const provider = providerMap.get(req.providerId);
      return {
        providerId: req.providerId,
        providerName: provider?.service ?? req.providerId,
        reason: req.reason,
        optional: req.optional ?? false,
      };
    }),
};

const Skill: SkillResolvers = {
  template: (parent) => {
    const tmpl = getSkillTemplate(parent.templateId);
    if (!tmpl) throw new Error(`Template ${parent.templateId} not found`);
    return tmpl;
  },

  requiredConnections: async (parent, _args, ctx) => {
    const tmpl = getSkillTemplate(parent.templateId);
    if (!tmpl?.requiredConnections?.length) return [];

    const bindings = parseConnectionBindings(parent.connectionBindings);

    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connectionSet = new Set(
      connections
        .filter((c) => !c.isRevoked)
        .map((c) => c.id),
    );

    return tmpl.requiredConnections.map((req) => {
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
  Query: { skillTemplates, skillTemplate, skills, skill },
  Mutation: { installSkill, uninstallSkill, bindSkillConnection, setSkillMcpEnabled },
  SkillTemplate,
  Skill,
};
