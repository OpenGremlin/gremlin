import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface GremlinConfig {
  version: string;
  aws?: {
    profile?: string;
    region: string;
    accountId: string;
    stackPrefix: string;
  };
  server?: {
    url: string;
  };
  domain?: string;
  eventSources?: {
    gmail?: {
      gcpProject: string;
      accounts: string[];
    };
  };
}

const CONFIG_DIR = path.join(os.homedir(), ".gremlin");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): GremlinConfig | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as GremlinConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: GremlinConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
