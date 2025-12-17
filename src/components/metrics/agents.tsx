/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  ChartCard
} from './chartcard';

import {
  useMetricsConfig
} from './metricsconfigprovider';

import {
  collectMetricsByDay, createDayRange
} from './utils';


/**
 * A metrics chart that renders daily agent runs.
 */
export
function AgentRunsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'agent_runs_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 16,
      left: 0,
      right: 0,
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: dayRange
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, 0.01]
    },
    series: [
      {
        name: 'Agent Runs',
        type: 'line',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Agent Runs'
      description='Agent runs per day'
      option={ option } />
  );
}


/**
 * A metrics chart that renders agent sessions.
 */
export
function AgentSessionsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'agent_sessions_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 16,
      left: 0,
      right: 0,
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: dayRange
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, 0.01]
    },
    series: [
      {
        name: 'Agent Sessions',
        type: 'line',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Agent Sessions'
      description='Agent sessions per day'
      option={ option } />
  );
}
