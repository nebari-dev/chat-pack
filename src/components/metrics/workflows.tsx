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
} from './configprovider';

import {
  collectMetricsByDay, createDayRange
} from './utils';


/**
 * A metrics chart that renders daily workflow runs.
 */
export
function WorkflowRunsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'workflow_runs_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#fd9a00'],
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
        name: 'Workflow Runs',
        type: 'line',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Workflow Runs'
      description='Workflow runs per day'
      option={ option } />
  );
}


/**
 * A metrics chart that renders workflow sessions.
 */
export
function WorkflowSessionsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'workflow_sessions_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#fd9a00'],
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
        name: 'Workflow Sessions',
        type: 'line',
        symbol: 'rect',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Workflow Sessions'
      description='Workflow sessions per day'
      option={ option } />
  );
}
