import {
  $remove,
  $set,
} from "dynamodb-toolbox/entity/actions/update";

/**
 * Convert a GraphQL patch input into a dynamodb-toolbox update item.
 *
 * - undefined (field omitted from request) → key skipped
 * - null (field explicitly set to null)    → $remove()
 * - plain object                           → $set() with recursive null→$remove() handling
 * - any other value                        → passed through as-is
 */
export function patchUpdates(
  input: object,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  for (const key in input) {
    const value = (input as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (value === null) {
      updates[key] = $remove();
    } else if (isPlainObject(value)) {
      updates[key] = $set(applyNulls(value));
    } else {
      updates[key] = value;
    }
  }

  return updates;
}

function applyNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value === undefined) continue;
    if (value === null) {
      result[key] = undefined;
    } else if (isPlainObject(value)) {
      result[key] = applyNulls(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Object.prototype.toString.call(v) === "[object Object]";
}
