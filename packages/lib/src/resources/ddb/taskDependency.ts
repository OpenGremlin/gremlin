import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Table } from "dynamodb-toolbox/table";
import type { TaskDependencyItem } from "./schema/taskDependency.js";

function getTableHelpers(table: Table<any, any, any>) {
  return {
    tableName: table.getName(),
    docClient: table.getDocumentClient(),
  };
}

export async function addDependency(
  table: Table<any, any, any>,
  input: {
    taskId: string;
    dependsOnId: string;
    depType?: string;
    createdBy: string;
  },
): Promise<TaskDependencyItem> {
  const { tableName, docClient } = getTableHelpers(table);
  const now = new Date().toISOString();
  const depType = input.depType ?? "blocks";

  const item: TaskDependencyItem = {
    taskId: input.taskId,
    dependsOnId: input.dependsOnId,
    depType,
    createdAt: now,
    createdBy: input.createdBy,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        ...item,
        _et: "TaskDependency",
        pk: `TASK_DEP#${input.taskId}`,
        sk: `DEP#${input.dependsOnId}`,
        gsi1pk: `TASK_DEPREV#${input.dependsOnId}`,
        gsi1sk: `DEP#${input.taskId}`,
      },
    }),
  );

  return item;
}

export async function removeDependency(
  table: Table<any, any, any>,
  input: { taskId: string; dependsOnId: string },
): Promise<void> {
  const { tableName, docClient } = getTableHelpers(table);

  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        pk: `TASK_DEP#${input.taskId}`,
        sk: `DEP#${input.dependsOnId}`,
      },
    }),
  );
}

/** Returns all tasks that `taskId` depends on (its blockers). */
export async function getDependencies(
  table: Table<any, any, any>,
  taskId: string,
): Promise<TaskDependencyItem[]> {
  const { tableName, docClient } = getTableHelpers(table);

  const { Items = [] } = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `TASK_DEP#${taskId}`,
        ":skPrefix": "DEP#",
      },
    }),
  );

  return Items as TaskDependencyItem[];
}

/** Returns all tasks that depend on `dependsOnId` (its dependents). */
export async function getDependents(
  table: Table<any, any, any>,
  dependsOnId: string,
): Promise<TaskDependencyItem[]> {
  const { tableName, docClient } = getTableHelpers(table);

  const { Items = [] } = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `TASK_DEPREV#${dependsOnId}`,
        ":skPrefix": "DEP#",
      },
    }),
  );

  return Items as TaskDependencyItem[];
}
