import cronstrue from "cronstrue";
import { router } from "expo-router";
import { Calendar, Play, Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  AgentJobsQuery,
  JobCreatedSubscription,
  TriggerJobMutation,
} from "../../../src/graphql/queries";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { useQuery } from "../../../src/hooks/useQuery";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { gql } from "../../../src/lib/auth";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Button } from "../../../src/shared/Button";
import { EmptyState } from "../../../src/shared/EmptyState";
import { formatDate } from "../../../src/shared/formatDate";
import { ListCard } from "../../../src/shared/ListCard";
import { QueryResult } from "../../../src/shared/QueryResult";

function RunNowButton({ jobId }: { jobId: string }) {
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const colors = useNavigationTheme();

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
        <Text className="text-xs text-success">Queued</Text>
      ) : (
        <Play size={14} color={colors.iconMuted} />
      )}
    </Pressable>
  );
}

export default function JobsScreen() {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(AgentJobsQuery);
  const { refreshing, onRefresh } = useListRefresh(refetch);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useSubscription(JobCreatedSubscription, {}, () => {
    refetchRef.current();
  });

  const jobs = data?.agentJobs ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-6 gap-3"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.loadingIndicator}
        />
      }
    >
      <QueryResult loading={loading} error={error} onRetry={refetch} />

      {!loading && jobs.length === 0 && (
        <EmptyState
          message="No scheduled jobs"
          description="Jobs run your agents on a schedule automatically."
          icon={<Calendar size={32} color={colors.iconMuted} />}
          actionLabel="Create Job"
          onAction={() => router.push("/jobs/new")}
        />
      )}

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
                <Text className="text-xs text-warning">Paused</Text>
              ) : (
                <RunNowButton jobId={job.id} />
              )}
            </View>
          }
          subtitle={
            <>
              <Text className="text-xs text-text-muted">
                {job.cronExpression
                  ? cronstrue.toString(job.cronExpression)
                  : job.recurrence}
              </Text>
              {!job.paused && (
                <Text className="text-xs text-text-muted mt-0.5">
                  Next: {formatDate(job.nextRun, "Not scheduled")}
                </Text>
              )}
            </>
          }
        />
      ))}

      {jobs.length > 0 && (
        <Button
          onPress={() => router.push("/jobs/new")}
          variant="secondary"
          size="lg"
          icon={<Plus size={16} color={colors.accent} />}
        >
          New Job
        </Button>
      )}
    </ScrollView>
  );
}
