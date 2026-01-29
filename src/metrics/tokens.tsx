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
 * A metrics chart that renders daily token usage.
 */
export
function TokensChart(): ReactNode {
  // Fetch the metrics config.
  const { year, month, data } = useMetricsConfig();

  // Create the day range for the month of interest.
  const dayRange = createDayRange(year, month);

  // Collect the relevant metrics.
  const tokensMap = collectMetricsByDay(data, 'token_metrics');

  // Create the chart data and fill in missing values.
  const input: number[] = [];
  const output: number[] = [];
  for (const day of dayRange) {
    const toks = tokensMap.get(day);
    input.push(toks?.input_tokens ?? 0);
    output.push(toks?.output_tokens ?? 0);
  }

  // Create the echarts option.
  const option: ChartCard.Option = {
    color: ['#00bc7d', '#fd9a00'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        // Fetch the callback params.
        const cbp0 = params[0];
        const cbp1 = params[1];

        // Create the date for fetching the short month string.
        const date = new Date(year, month, 0);

        // Convert the date the shot month string.
        const monthStr = date.toLocaleString('default', { month: 'short' });

        // Return the tooltip HMTL.
        return (`
          <div class='grid gap-x-4 auto-cols-max'>
            <div class='col-span-2 font-semibold'>
              ${cbp0.axisValue} ${monthStr} ${year}
            </div>
            <div>
              ${cbp0.marker} Input Tokens
            </div>
            <div class='font-semibold'>
              ${cbp0.value}
            </div>
            <div>
              ${cbp1.marker} Output Tokens
            </div>
            <div class='font-semibold'>
              ${cbp1.value}
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
        name: 'Input Tokens',
        type: 'bar',
        data: input
      },
      {
        name: 'Output Tokens',
        type: 'bar',
        data: output
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Token Usage'
      description='Input and output tokens per day'
      option={ option } />
  );
}
