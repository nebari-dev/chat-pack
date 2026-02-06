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
 * A metrics chart that renders daily agent runs.
 */
export
function AgentRunsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, metrics } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(metrics, 'runsCount');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#ad46ff'],
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        // Fetch the callback params.
        const cbp = params[0];

        // Create the date for fetching the short month string.
        const date = new Date(year, month, 0);

        // Convert the date the shot month string.
        const monthStr = date.toLocaleString('default', { month: 'short' });

        // Return the tooltip HMTL.
        return (`
          <div class='grid gap-x-4 auto-cols-max'>
            <div class='col-span-2 font-semibold'>
              ${cbp.axisValue} ${monthStr} ${year}
            </div>
            <div>
              ${cbp.marker} Agent Runs
            </div>
            <div class='font-semibold'>
              ${cbp.value}
            </div>
          </div>
        `);
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
  const { year, month, metrics } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(metrics, 'sessionsCount');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#ff2056'],
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        // Fetch the callback params.
        const cbp = params[0];

        // Create the date for fetching the short month string.
        const date = new Date(year, month, 0);

        // Convert the date the shot month string.
        const monthStr = date.toLocaleString('default', { month: 'short' });

        // Return the tooltip HMTL.
        return (`
          <div class='grid gap-x-4 auto-cols-max'>
            <div class='col-span-2 font-semibold'>
              ${cbp.axisValue} ${monthStr} ${year}
            </div>
            <div>
              ${cbp.marker} Agent Sessions
            </div>
            <div class='font-semibold'>
              ${cbp.value}
            </div>
          </div>
        `);
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
        symbol: 'rect',
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
