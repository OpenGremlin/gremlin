import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Request, Response } from "express";

export function createAuthConfigRoute(resources: Resources) {
  return async (_req: Request, res: Response): Promise<void> => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const cognitoDomain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!cognitoDomain || !clientId) {
      res.json({ skipAuth: true });
      return;
    }
    let signupDisabled = false;
    try {
      const { GetItemCommand } = await import(
        "dynamodb-toolbox/entity/actions/get"
      );
      const { Item } = await resources.ddb.entities.GlobalSettings.build(
        GetItemCommand,
      )
        .key({ id: "global" })
        .send();
      if (Item) {
        signupDisabled = Item.signupDisabled === true;
      }
    } catch {
      // Settings not available yet — default to allowing signup
    }
    res.json({ cognitoDomain, clientId, signupDisabled });
  };
}
