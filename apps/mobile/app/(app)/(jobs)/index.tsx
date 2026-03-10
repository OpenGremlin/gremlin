import cronstrue from "cronstrue";
import { router } from "expo-router";
import { Play, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AgentJobsQuery } from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { formatDate } from "../../../src/shared/formatDate";
import { QueryResult } from "../../../src/shared/QueryResult";

function RunNowButton({ jobId }: { jobId: string }) {
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  return (
    <Pressable
      disabled={triggering}
      onPress={async () => {
        setTriggering(true);
        try {
          await gql(`mutation TriggerJob($id: ID!) { triggerJob(id: $id) }`, {
            id: jobId,
          });
          setTriggered(true);
          setTimeout(() => setTriggered(false), 3000);
        } finally {
          setTriggering(false);
        }
      }}
      className={`shrink-0 p-1.5 rounded-lg ${triggering ? "opacity-50" : ""}`}
    >
      {triggered ? (
        <Text className="text-xs text-green-400">Queued</Text>
      ) : (
        <Play size={14} color="#737373" />
      )}
    </Pressable>
  );
}

export default function JobsScreen() {
  const { data, loading, error } = useQuery(AgentJobsQuery);

  const jobs = data?.agentJobs ?? [];

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3">
      <QueryResult loading={loading} error={error} />

      {jobs.map((job) => (
        <Pressable
          key={job.id}
          onPress={() => router.push(`/(app)/(jobs)/${job.id}`)}
          className={`bg-neutral-900 rounded-xl p-4 ${job.paused ? "opacity-50" : ""}`}
        >
          <View className="flex-row items-center gap-3">
            <AgentAvatar id={job.agent.id} />
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-sm font-medium text-neutral-100 flex-1"
                  numberOfLines={1}
                >
                  {job.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  {job.paused ? (
                    <Text className="text-xs text-amber-400">Paused</Text>
                  ) : (
                    <RunNowButton jobId={job.id} />
                  )}
                </View>
              </View>
              <Text className="text-xs text-neutral-400">
                {job.cronExpression
                  ? cronstrue.toString(job.cronExpression)
                  : job.recurrence}
              </Text>
              {!job.paused && (
                <Text className="text-xs text-neutral-500 mt-0.5">
                  Next: {formatDate(job.nextRun, "Not scheduled")}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push("/(app)/(jobs)/new")}
        className="self-start flex-row items-center gap-1.5 py-2"
      >
        <Plus size={14} color="#737373" />
        <Text className="text-xs text-neutral-500">New Job</Text>
      </Pressable>
    </ScrollView>
  );
}
