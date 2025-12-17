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
