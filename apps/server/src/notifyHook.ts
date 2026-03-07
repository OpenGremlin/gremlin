import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type { Request, Response } from "express";
import { createLogger } from "./logger.js";
import type { Resources } from "./resources/index.js";
import type { Services } from "./services/index.js";

const log = createLogger("notifyHook");

let cachedNotifyHookRoleArn: string | undefined;

async function getNotifyHookRoleArn(): Promise<string | undefined> {
  if (cachedNotifyHookRoleArn) return cachedNotifyHookRoleArn;
  try {
    const ssm = new SSMClient({});
    const res = await ssm.send(
      new GetParameterCommand({ Name: "/gremlin/notify-hook-role-arn" }),
    );
    cachedNotifyHookRoleArn = res.Parameter?.Value;
    return cachedNotifyHookRoleArn;
  } catch {
    return undefined;
  }
}

interface NotifyHookPayload {
  type: string;
  agentId: string;
  payload: Record<string, unknown>;
}

export function createNotifyHookHandler(
  resources: Resources,
  services: Services,
) {
  return async (req: Request, res: Response) => {
    try {
      // Extract credentials from headers
      const accessKeyId = req.headers["x-aws-access-key-id"] as string;
      const secretAccessKey = req.headers["x-aws-secret-access-key"] as string;
      const sessionToken = req.headers["x-aws-session-token"] as string;

      if (!accessKeyId || !secretAccessKey || !sessionToken) {
        log.warn("Missing AWS credentials in headers");
        res.status(401).json({ error: "Missing credentials" });
        return;
      }

      // Verify caller identity using the provided credentials
      const sts = new STSClient({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });

      const identity = await sts.send(new GetCallerIdentityCommand({}));
      const callerArn = identity.Arn;

      // Verify the caller assumed the expected notify hook role.
      // STS returns: arn:aws:sts::ACCOUNT:assumed-role/ROLE_NAME/SESSION
      // Expected role ARN: arn:aws:iam::ACCOUNT:role/ROLE_NAME
      // Extract the role name from both and compare.
      const expectedRoleArn = await getNotifyHookRoleArn();
      const expectedRoleName = expectedRoleArn?.split("/").pop();
      const callerRoleName = callerArn?.split("/").at(-2); // assumed-role/ROLE_NAME/session → ROLE_NAME
      if (!expectedRoleName || callerRoleName !== expectedRoleName) {
        log.warn(
          { callerArn, expectedRoleArn },
          "Caller is not the expected notify hook role",
        );
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      log.info({ callerArn }, "Notify hook caller verified");

      // Process the payload
      const body = req.body as NotifyHookPayload;
      if (!body?.type || !body?.agentId) {
        res.status(400).json({ error: "Missing type or agentId" });
        return;
      }

      const ctx = {
        resources,
        services,
        log: log.child({ agentId: body.agentId }),
      };

      log.info(
        { type: body.type, agentId: body.agentId, payload: body.payload },
        "Processing notify hook",
      );

      await services.inbox.enqueueWork(ctx as any, body.agentId, {
        type: body.type as any,
        payload: body.payload,
      });

      res.json({ ok: true });
    } catch (err) {
      log.error(
        { error: (err as Error).message },
        "Notify hook handler failed",
      );
      res.status(500).json({ error: "Internal error" });
    }
  };
}
