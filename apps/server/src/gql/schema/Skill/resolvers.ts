import { providers } from "@gremlin/lib/services/integrations/providers.js";
import { getSkillsBucket } from "@gremlin/lib/services/skills/getSkillsBucket.js";
import { parseConnectionBindings } from "@gremlin/lib/services/skills/parseConnectionBindings.js";
import {
  getSkillTemplateFromS3,
  scanSkillCatalog,
} from "@gremlin/lib/services/skills/skillScanner.js";
import type {
  AgentSkillResolvers,
  MutationResolvers,
  QueryResolvers,
  SkillTemplateResolvers,
} from "../../resolverTypes.js";

const providerMap = new Map(providers.map((p) => [p.id, p]));

// --- Queries ---

const skillTemplates: QueryResolvers["skillTemplates"] = async () => {
  const bucketName = getSkillsBucket();
  return scanSkillCatalog(bucketName);
};

const skillTemplate: QueryResolvers["skillTemplate"] = async (
  _parent,
  { id },
) => {
  const bucketName = getSkillsBucket();
  return getSkillTemplateFromS3(bucketName, id);
};

const agentSkills: QueryResolvers["agentSkills"] = (
  _parent,
  { agentId },
  ctx,
) => ctx.services.skills.getAgentSkills(ctx, agentId);

// --- Mutations ---

const assignSkill: MutationResolvers["assignSkill"] = (
  _parent,
  { agentId, skillId },
  ctx,
) => ctx.services.skills.assignSkill(ctx, agentId, skillId);

const removeSkill: MutationResolvers["removeSkill"] = async (
  _parent,
  { agentId, skillId },
  ctx,
) => {
  await ctx.services.skills.removeSkill(ctx, agentId, skillId);
  return true;
};

const bindAgentSkillConnection: MutationResolvers["bindAgentSkillConnection"] =
  (_parent, { agentId, skillId, provider, connectionId }, ctx) =>
    ctx.services.skills.bindAgentSkillConnection(
      ctx,
      agentId,
      skillId,
      provider,
      connectionId,
    );

const unbindAgentSkillConnection: MutationResolvers["unbindAgentSkillConnection"] =
  (_parent, { agentId, skillId, provider, connectionId }, ctx) =>
    ctx.services.skills.unbindAgentSkillConnection(
      ctx,
      agentId,
      skillId,
      provider,
      connectionId,
    );

// --- Type Resolvers ---

const SkillTemplate: SkillTemplateResolvers = {
  hasInstall: (parent) => !!parent.install,
  connections: (parent) =>
    (parent.connections ?? []).map((conn) => {
      const provider = providerMap.get(conn.provider);
      return {
        provider: conn.provider,
        providerName: provider?.service ?? conn.provider,
        reason: conn.reason,
        optional: conn.optional ?? false,
        multi: conn.multi ?? false,
        requestedScopes: conn.requestedScopes ?? null,
      };
    }),
};

const AgentSkill: AgentSkillResolvers = {
  template: async (parent) => {
    const bucketName = getSkillsBucket();
    return getSkillTemplateFromS3(bucketName, parent.skillId);
  },

  connectionStatuses: async (parent, _args, ctx) => {
    const bucketName = getSkillsBucket();
    const template = await getSkillTemplateFromS3(bucketName, parent.skillId);
    if (!template?.connections?.length) return [];

    const bindings = parseConnectionBindings(parent.connectionBindings);

    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connectionSet = new Set(
      connections.filter((c) => !c.isRevoked).map((c) => c.id),
    );

    return template.connections.map((req) => {
      const boundIds = bindings[req.provider] ?? [];
      const provider = providerMap.get(req.provider);
      // Connected if at least one bound connection is valid
      const connected = boundIds.some((id) => connectionSet.has(id));
      return {
        provider: req.provider,
        providerName: provider?.service ?? req.provider,
        reason: req.reason,
        optional: req.optional ?? false,
        multi: req.multi ?? false,
        boundConnectionIds: boundIds,
        connected,
      };
    });
  },
};

export const skillResolvers = {
  Query: { skillTemplates, skillTemplate, agentSkills },
  Mutation: {
    assignSkill,
    removeSkill,
    bindAgentSkillConnection,
    unbindAgentSkillConnection,
  },
  SkillTemplate,
  AgentSkill,
};
