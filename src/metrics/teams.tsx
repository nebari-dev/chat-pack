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
 * A metrics chart that renders daily team runs.
 */
export
function TeamRunsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'team_runs_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#00bc7d'],
    tooltip: {
      trigger: 'axis',
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
              ${cbp.marker} Team Runs
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
        name: 'Team Runs',
        type: 'line',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Team Runs'
      description='Team runs per day'
      option={ option } />
  );
}


/**
 * A metrics chart that renders team sessions.
 */
export
function TeamSessionsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const countsMap = collectMetricsByDay(data, 'team_sessions_count');

  // Create the chart data and fill in missing values.
  const counts: number[] = [];
  for (const day of dayRange) {
    counts.push(countsMap.get(day) ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#00bc7d'],
    tooltip: {
      trigger: 'axis',
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
              ${cbp.marker} Team Sessions
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
        name: 'Team Sessions',
        type: 'line',
        symbol: 'rect',
        data: counts
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Team Sessions'
      description='Team sessions per day'
      option={ option } />
  );
}
