import type {
  ReactNode
} from "react";

import {
  useQuery
} from "@tanstack/react-query";

import {
  useMetricsConfig
} from './metricsconfigprovider';

import {
  useEffect, useState
} from "react";

import {
  MetricsBarChart,
  MetricsLineChart,
  MetricsRadialChart,
  MonthSelector,
  monthStart,
  buildDayMap,
  buildDailySeries,
  sumMetric,
} from "./";

import * as api from "@/api";

export function Metrics(): ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.getMetrics,
  });

  const config = useMetricsConfig();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const today = new Date();
    return monthStart(today);
  });

  // Initialize selectedMonth to the current month when data is loaded
  useEffect(() => {
    // Only apply when URL params are present
    if (config.month != null && config.year != null) {
      const date = new Date(config.year, config.month - 1, 1);
      setSelectedMonth(date);
    }
    // If URL params are missing, keep the current default (today)
  }, [config.month, config.year]);

  if (isLoading || !data || !selectedMonth) return null;
  if (error) return null;

  const metrics = data.metrics;
  const maxMonth = monthStart(new Date());

  // Calculate the date and number of days for monthly statistics charts
  const year = selectedMonth.getFullYear();
  const monthIndex = selectedMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Only metrics for the selected month
  const metricsForMonth = metrics.filter((m) => {
    const d = new Date(m.date);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });


  const usersByDay = buildDayMap(metricsForMonth, (m) => m.users_count);
  const agentRunsByDay = buildDayMap(metricsForMonth, (m) => m.agent_runs_count);
  const agentSessionsByDay = buildDayMap(
    metricsForMonth,
    (m) => m.agent_sessions_count,
  );
  const teamRunsByDay = buildDayMap(metricsForMonth, (m) => m.team_runs_count);
  const teamSessionsByDay = buildDayMap(
    metricsForMonth,
    (m) => m.team_sessions_count,
  );
  const workflowRunsByDay = buildDayMap(
    metricsForMonth,
    (m) => m.workflow_runs_count,
  );
  const workflowSessionsByDay = buildDayMap(
    metricsForMonth,
    (m) => m.workflow_sessions_count,
  );

  const tokenByDay = new Map<number, { input: number; output: number }>();
  for (const m of metricsForMonth) {
    const day = new Date(m.date).getDate();
    tokenByDay.set(day, {
      input: m.token_metrics.input_tokens,
      output: m.token_metrics.output_tokens,
    });
  }

  const modelCounts = metricsForMonth
    .flatMap((m) => m.model_metrics)
    .reduce((map, mm) => {
      const prev = map.get(mm.model_id) ?? 0;
      map.set(mm.model_id, prev + mm.count);
      return map;
    }, new Map<string, number>());

  // Token chart data 
  const tokenData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const entry = tokenByDay.get(day);
    return {
      label: String(day),
      input: entry?.input ?? 0,
      output: entry?.output ?? 0,
    };
  });

  const totalTokens = sumMetric(
    metricsForMonth,
    (m) => m.token_metrics.total_tokens,
  );

  // Users
  const usersData = buildDailySeries(daysInMonth, usersByDay, "users");
  const totalUsers = sumMetric(metricsForMonth, (m) => m.users_count);

  // Agent runs
  const agentRunsData = buildDailySeries(daysInMonth, agentRunsByDay, "runs");
  const totalAgentRuns = sumMetric(metricsForMonth, (m) => m.agent_runs_count);

  // Agent sessions
  const agentSessionsData = buildDailySeries(
    daysInMonth,
    agentSessionsByDay,
    "sessions",
  );
  const totalAgentSessions = sumMetric(
    metricsForMonth,
    (m) => m.agent_sessions_count,
  );

  // Team runs 
  const teamRunsData = buildDailySeries(daysInMonth, teamRunsByDay, "runs");
  const totalTeamRuns = sumMetric(metricsForMonth, (m) => m.team_runs_count);

  // Team sessions 
  const teamSessionsData = buildDailySeries(
    daysInMonth,
    teamSessionsByDay,
    "sessions",
  );
  
  const totalTeamSessions = sumMetric(
    metricsForMonth,
    (m) => m.team_sessions_count,
  );

  // Workflow runs 
  const workflowRunsData = buildDailySeries(
    daysInMonth,
    workflowRunsByDay,
    "runs",
  );

  const totalWorkflowRuns = sumMetric(
    metricsForMonth,
    (m) => m.workflow_runs_count,
  );

  // Workflow sessions 
  const workflowSessionsData = buildDailySeries(
    daysInMonth,
    workflowSessionsByDay,
    "sessions",
  );

  const totalWorkflowSessions = sumMetric(
    metricsForMonth,
    (m) => m.workflow_sessions_count,
  );

  // Model runs (radial) 
  const modelRunsData: MetricsRadialChart.Data = {};
  const modelRunsSeries: MetricsRadialChart.Series[] = [];

  Array.from(modelCounts.entries()).forEach(([modelId, count]) => {
    const key = modelId;
    modelRunsData[key] = count;
    modelRunsSeries.push({
      key,
      label: modelId,
    });
  });

  // Month selector controls
  const canGoPrev = true;
  const canGoNext = selectedMonth < maxMonth;

  const monthLabel = selectedMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function changeMonth(offset: number) {
    setSelectedMonth((prev) => {
      if (!prev) return prev;

      // Compute the next month date
      let next = monthStart(
        new Date(prev.getFullYear(), prev.getMonth() + offset),
      );

      // Sync URL query params with the new month/year
      const nextMonth = next.getMonth() + 1;
      const nextYear = next.getFullYear();

      config.setDate(nextMonth, nextYear);

      return next;
    });
  }

  return (
    <main className="w-full p-5">
      <div className="w-full h-full max-w-6x1 mx-auto">
        <MonthSelector
          label={monthLabel}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
        />

        <div className="grid h-full grid-cols-3 grid-rows-3 gap-4 pb-10">
          {/* 1. Total tokens */}
          <MetricsBarChart
            title="Total tokens"
            description="Input vs output tokens per day"
            total={totalTokens}
            data={tokenData}
            series={[
              { key: "input", label: "Input tokens" },
              { key: "output", label: "Output tokens" },
            ]}
            stackId="tokens"
          />

          {/* 2. Users */}
          <MetricsBarChart
            title="Users"
            description="Users per day"
            total={totalUsers}
            data={usersData}
            series={[{ key: "users", label: "Users" }]}
            stackId="users"
          />

          {/* 3. Agent runs */}
          <MetricsLineChart
            title="Agent runs"
            description="Runs per day"
            total={totalAgentRuns}
            data={agentRunsData}
            series={[{ key: "runs", label: "Runs" }]}
          />

          {/* 4. Agent sessions */}
          <MetricsLineChart
            title="Agent sessions"
            description="Sessions per day"
            total={totalAgentSessions}
            data={agentSessionsData}
            series={[{ key: "sessions", label: "Sessions" }]}
          />

          {/* 5. Team runs */}
          <MetricsBarChart
            title="Team runs"
            description="Runs per day"
            total={totalTeamRuns}
            data={teamRunsData}
            series={[{ key: "runs", label: "Runs" }]}
            stackId="team-runs"
          />

          {/* 6. Team sessions */}
          <MetricsBarChart
            title="Team sessions"
            description="Sessions per day"
            total={totalTeamSessions}
            data={teamSessionsData}
            series={[{ key: "sessions", label: "Sessions" }]}
            stackId="team-sessions"
          />

          {/* 7. Workflow runs */}
          <MetricsBarChart
            title="Workflow runs"
            description="Runs per day"
            total={totalWorkflowRuns}
            data={workflowRunsData}
            series={[{ key: "runs", label: "Runs" }]}
            stackId="workflow-runs"
          />

          {/* 8. Workflow sessions */}
          <MetricsBarChart
            title="Workflow sessions"
            description="Sessions per day"
            total={totalWorkflowSessions}
            data={workflowSessionsData}
            series={[{ key: "sessions", label: "Sessions" }]}
            stackId="workflow-sessions"
          />

          {/* 9. Model runs (radial) */}
          <MetricsRadialChart
            title="Model runs"
            description="Runs per model"
            centerLabel="Model runs"
            data={modelRunsData}
            series={modelRunsSeries}
          />
        </div>
      </div>
    </main>
  );
}