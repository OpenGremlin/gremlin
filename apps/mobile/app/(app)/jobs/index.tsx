import cronstrue from "cronstrue";
import { router } from "expo-router";
import { Play, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  AgentJobsQuery,
  TriggerJobMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { formatDate } from "../../../src/shared/formatDate";
import { ListCard } from "../../../src/shared/ListCard";
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
          await gql(TriggerJobMutation, { id: jobId });
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
        <ListCard
          key={job.id}
          agentId={job.agent.id}
          title={job.name}
          onPress={() => router.push(`/jobs/${job.id}`)}
          dimmed={job.paused}
          badge={
            <View className="flex-row items-center gap-2">
              {job.paused ? (
                <Text className="text-xs text-amber-400">Paused</Text>
              ) : (
                <RunNowButton jobId={job.id} />
              )}
            </View>
          }
          subtitle={
            <>
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
            </>
          }
        />
      ))}

      <Pressable
        onPress={() => router.push("/jobs/new")}
        className="self-start flex-row items-center gap-1.5 py-2"
      >
        <Plus size={14} color="#737373" />
        <Text className="text-xs text-neutral-500">New Job</Text>
      </Pressable>
    </ScrollView>
  );
}
