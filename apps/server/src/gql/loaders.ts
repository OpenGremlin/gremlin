import DataLoader from "dataloader";
import type { Entity, FormattedItem } from "dynamodb-toolbox/entity";
import { BatchGetRequest } from "dynamodb-toolbox/entity/actions/batchGet";
import {
  BatchGetCommand,
  execute,
} from "dynamodb-toolbox/table/actions/batchGet";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentItem } from "@gremlin/lib/resources/ddb/schema/agent.js";
import type { TaskItem } from "@gremlin/lib/resources/ddb/schema/task.js";
import type { Resources } from "@gremlin/lib/resources/index.js";

export interface Loaders {
  agentLoader: DataLoader<string, AgentItem | null>;
  taskLoader: DataLoader<string, TaskItem | null>;
  tasksByAgentLoader: DataLoader<string, TaskItem[]>;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function createEntityBatchLoader<E extends Entity>(
  resources: Resources,
  entity: E,
): DataLoader<string, FormattedItem<E> | null> {
  return new DataLoader<string, FormattedItem<E> | null>(async (ids) => {
    const chunks = chunkArray([...ids], 100);
    const resultMap = new Map<string, FormattedItem<E>>();

    for (const chunk of chunks) {
      const requests = chunk.map((id) =>
        // biome-ignore lint/suspicious/noExplicitAny: generic entity key type
        entity.build(BatchGetRequest).key({ id } as any),
      );

      const cmd = resources.ddb.table
        .build(BatchGetCommand)
        .requests(...requests);
      const { Responses } = await execute(cmd);

      const items = Responses[0] as (FormattedItem<E> | undefined)[];
      for (const item of items) {
        if (item) {
          // biome-ignore lint/suspicious/noExplicitAny: generic entity item type
          resultMap.set((item as any).id, item);
        }
      }
    }

    return ids.map((id) => resultMap.get(id) ?? null);
  });
}

export function createLoaders(resources: Resources): Loaders {
  const agentLoader = createEntityBatchLoader(
    resources,
    resources.ddb.entities.Agent,
  ) as DataLoader<string, AgentItem | null>;

  const taskLoader = createEntityBatchLoader(
    resources,
    resources.ddb.entities.Task,
  ) as DataLoader<string, TaskItem | null>;

  const tasksByAgentLoader = new DataLoader<string, TaskItem[]>(
    async (agentIds) => {
      const results = await Promise.all(
        agentIds.map(async (agentId) => {
          const { Items } = await resources.ddb.table
            .build(QueryCommand)
            .entities(resources.ddb.entities.Task)
            .query({ index: "gsi1", partition: `TASK_AGENT#${agentId}` })
            .send();
          return Items ?? [];
        }),
      );
      return results;
    },
  );

  return { agentLoader, taskLoader, tasksByAgentLoader };
}
