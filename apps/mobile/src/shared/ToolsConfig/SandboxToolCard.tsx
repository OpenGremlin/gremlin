import { Terminal } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { AllowlistConfig } from "../AllowlistConfig";
import { Card } from "../Card";
import { Toggle } from "../Toggle";
import type { PlainConfig } from "./helpers";

interface SandboxToolCardProps {
  agentId: string;
  config: PlainConfig;
  updateConfig: (patch: Partial<PlainConfig>) => void;
}

export function SandboxToolCard({
  agentId,
  config,
  updateConfig,
}: SandboxToolCardProps) {
  const colors = useNavigationTheme();
  const sandbox = config.sandbox;

  return (
    <Card className="overflow-hidden">
      <View className="flex-row px-4 py-3 gap-3">
        <View className="w-[22px] pt-0.5">
          <Terminal size={22} color={colors.iconDefault} />
        </View>
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-text-secondary">
                Sandbox
              </Text>
              <Text className="text-xs text-text-muted">
                A shell for running commands and scripts
              </Text>
            </View>
            <Toggle
              enabled={sandbox?.enabled ?? false}
              onChange={() => {
                const wasEnabled = sandbox?.enabled ?? false;
                updateConfig({
                  sandbox: wasEnabled
                    ? { enabled: false, commandApproval: "ask" }
                    : {
                        enabled: true,
                        idleTimeoutMinutes:
                          sandbox?.idleTimeoutMinutes ?? 20,
                        alwaysOn: sandbox?.alwaysOn ?? false,
                        commandApproval: sandbox?.commandApproval ?? "ask",
                      },
                });
              }}
            />
          </View>
          {sandbox?.enabled && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-text-secondary">Always On</Text>
                  <Text className="text-xs text-text-muted">
                    Keep running between tasks. Cold starts take ~2 minutes.
                  </Text>
                </View>
                <Toggle
                  enabled={sandbox.alwaysOn ?? false}
                  onChange={() => {
                    updateConfig({
                      sandbox: {
                        ...sandbox,
                        alwaysOn: !(sandbox.alwaysOn ?? false),
                      },
                    });
                  }}
                />
              </View>
              {!sandbox.alwaysOn && (
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-1">
                      <Text className="text-sm text-text-secondary">
                        Idle Shutdown
                      </Text>
                      <Text className="text-xs text-text-muted">
                        Shut down after this long without activity
                      </Text>
                    </View>
                    <Text className="text-sm text-text-muted">
                      {sandbox.idleTimeoutMinutes ?? 20} min
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {[10, 20, 30, 60, 120].map((mins) => {
                      const selected =
                        (sandbox.idleTimeoutMinutes ?? 20) === mins;
                      return (
                        <Pressable
                          key={mins}
                          onPress={() =>
                            updateConfig({
                              sandbox: {
                                ...sandbox,
                                idleTimeoutMinutes: mins,
                              },
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg border ${selected ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
                        >
                          <Text
                            className={`text-xs ${selected ? "text-text-primary" : "text-text-muted"}`}
                          >
                            {mins} min
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
              <View>
                <View className="mb-1">
                  <Text className="text-sm text-text-secondary">
                    Command Approval
                  </Text>
                  <Text className="text-xs text-text-muted">
                    Whether to ask before the agent runs a command
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {(["ask", "skip"] as const).map((mode) => {
                    const current = sandbox.commandApproval ?? "ask";
                    const selected = current === mode;
                    const label =
                      mode === "ask" ? "Ask first" : "Skip (dangerous)";
                    return (
                      <Pressable
                        key={mode}
                        onPress={() =>
                          updateConfig({
                            sandbox: { ...sandbox, commandApproval: mode },
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg border ${selected ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
                      >
                        <Text
                          className={`text-xs ${selected ? "text-text-primary" : "text-text-muted"}`}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {sandbox.commandApproval === "ask" && (
                <AllowlistConfig agentId={agentId} />
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
