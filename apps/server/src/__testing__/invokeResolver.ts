import type { GraphQLResolveInfo } from "graphql";
import type { GremlinContext } from "../gql/context.js";

type Resolver<P, A, R> = (
  parent: P,
  args: A,
  ctx: GremlinContext,
  info: GraphQLResolveInfo,
) => R | Promise<R>;

// `info` defaults to an empty object cast to GraphQLResolveInfo. That's fine for the
// vast majority of resolvers, which ignore info. If you're testing a resolver that
// actually reads `info.fieldName`, `info.fieldNodes`, etc., pass a real one explicitly
// — otherwise you'll hit confusing "cannot read property X of undefined" errors.
export function invokeResolver<P, A, R>(
  resolver: Resolver<P, A, R>,
  opts: {
    parent?: P;
    args?: A;
    ctx: GremlinContext;
    info?: GraphQLResolveInfo;
  },
): Promise<R> {
  return Promise.resolve(
    resolver(
      (opts.parent ?? {}) as P,
      (opts.args ?? {}) as A,
      opts.ctx,
      (opts.info ?? {}) as GraphQLResolveInfo,
    ),
  );
}
