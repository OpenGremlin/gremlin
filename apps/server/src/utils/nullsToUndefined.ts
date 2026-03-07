// GraphQL optional inputs are: T | null | undefined
// DynamoDB Toolbox inputs are: T | undefined
// This function strips nulls and replaces with undefined so types are compatible.

type RecursivelyReplaceNullWithUndefined<T> = T extends null
  ? undefined
  : T extends (infer U)[]
    ? RecursivelyReplaceNullWithUndefined<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: RecursivelyReplaceNullWithUndefined<T[K]> }
      : T;

export function nullsToUndefined<T>(
  obj: T,
): RecursivelyReplaceNullWithUndefined<T> {
  if (obj === null || obj === undefined) {
    return undefined as RecursivelyReplaceNullWithUndefined<T>;
  }

  if (
    Object.prototype.toString.call(obj) === "[object Object]" ||
    Array.isArray(obj)
  ) {
    for (const key in obj) {
      obj[key] = nullsToUndefined(obj[key]) as typeof obj[typeof key];
    }
  }
  return obj as RecursivelyReplaceNullWithUndefined<T>;
}
