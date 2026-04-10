import { writeFileSync } from "node:fs";
import { print } from "graphql";
import { mergedTypeDefs } from "../src/gql/schema/mergedTypeDefs.js";

writeFileSync("schema.graphql", `${print(mergedTypeDefs)}\n`);
