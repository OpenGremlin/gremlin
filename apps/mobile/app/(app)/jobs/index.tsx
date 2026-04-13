import { useQuery, useSubscription } from "@apollo/client";
import cronstrue from "cronstrue";
import { router, useFocusEffect } from "expo-router";
import { Calendar, Play, Plus } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Pressable, RefreshControl, Text } from "react-native";
import {
  AgentJobsQuery,
  JobCreatedSubscription,
  TriggerJobMutation,
} from "../../../src/graphql/queries";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { execute } from "../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Button } from "../../../src/shared/Button";
import { EmptyState } from "../../../src/shared/EmptyState";
import { formatDate } from "../../../src/shared/formatDate";
import { ListCard } from "../../../src/shared/ListCard";
import { QueryGate } from "../../../src/shared/QueryResult";
import { TabScrollView } from "../../../src/shared/TabScrollView";

function RunNowButton({ jobId }: { jobId: string }) {
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const colors = useNavigationTheme();

  return (
    <Pressable
      disabled={triggering}
      onPress={async (e) => {
        e.stopPropagation();
        setTriggering(true);
        try {
          await execute(TriggerJobMutation, { id: jobId });
          setTriggered(true);
          setTimeout(() => setTriggered(false), 3000);
        } finally {
          setTriggering(false);
        }
      }}
      className={`shrink-0 w-10 h-10 items-center justify-center rounded-lg ${triggering ? "opacity-50" : ""}`}
    >
      {triggered ? (
        <Text className="text-xs text-success">Queued</Text>
      ) : (
        <Play size={18} color={colors.iconMuted} />
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

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useSubscription(JobCreatedSubscription, {
    onData: () => {
      refetchRef.current();
    },
  });

  const jobs = data?.agentJobs ?? [];

  return (
    <QueryGate loading={loading} error={error} data={data} onRetry={refetch}>
      <TabScrollView
        contentContainerClassName="px-4 pt-3 gap-3 grow"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
      >
        {jobs.length === 0 && (
          <EmptyState
            message="No scheduled jobs"
            description="Jobs run your agents on a schedule automatically."
            icon={<Calendar size={32} color={colors.iconMuted} />}
            actionLabel="Create Job"
            onAction={() => router.push("/jobs/new")}
          />
        )}

        {jobs.map((job) => {
          const retired = job.agent.retired;
          return (
            <ListCard
              key={job.id}
              agentId={job.agent.id}
              title={job.name}
              href={`/jobs/${job.id}`}
              dimmed={job.paused || retired}
              badge={
                retired ? (
                  <Text className="text-xs text-text-muted">Agent retired</Text>
                ) : job.paused ? (
                  <Text className="text-xs text-warning">Paused</Text>
                ) : null
              }
              trailing={
                !job.paused && !retired ? (
                  <RunNowButton jobId={job.id} />
                ) : undefined
              }
              subtitle={
                <>
                  <Text className="text-xs text-text-muted">
                    {job.cronExpression
                      ? cronstrue.toString(job.cronExpression)
                      : job.recurrence}
                  </Text>
                  {retired ? (
                    <Text className="text-xs text-text-muted mt-0.5">
                      Will not run
                    </Text>
                  ) : !job.paused ? (
                    <Text className="text-xs text-text-muted mt-0.5">
                      Next: {formatDate(job.nextRun, "Not scheduled")}
                    </Text>
                  ) : null}
                </>
              }
            />
          );
        })}

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
      </TabScrollView>
    </QueryGate>
  );
}
