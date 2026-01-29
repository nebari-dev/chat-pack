/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  ChartCard
} from './chartcard';

import {
  useMetricsConfig
} from './configprovider';


/**
 * A metrics chart that renders total model runs.
 */
export
function ModelRunsChart(): ReactNode {
  // Fetch the loaded metrics data.
  const { data } = useMetricsConfig();

  // Setup the array of runs.
  const runs = Private.collectModelRuns(data);

  // Create the echarts option.
  const option: ChartCard.Option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return (`
          <div class='grid gap-x-4 auto-cols-max'>
            <div class='col-span-2 font-semibold'>
              Model Runs
            </div>
            <div>
              ${params.marker} ${params.name}
            </div>
            <div class='font-semibold'>
              ${params.value}
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
    series: [
      {
        name: 'Model Runs',
        type: 'pie',
        radius: ['40%', '70%'],
        data: runs,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // Return the rendered component.
  return (
    <ChartCard
      title='Model Runs'
      description='Total model runs'
      option={ option } />
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for a model runs datum.
   */
  export
  type Datum = {
    /**
     * The name of the model.
     */
    name: string;

    /**
     * The number of runs for the model.
     */
    value: number;
  };

  /**
   * A function that creates a map of workflow runs by day.
   *
   * @param data - The API metrics response for the date range of interest.
   *
   * @returns A mapping of day to workflow runs in the range.
   */
  export
  function collectModelRuns(data: api.Metrics): Datum[] {
    // Create the map to aggregate the model counts.
    const map = new Map<string, number>();

    // Iterate the metrics and collect the total run counts.
    for (const { model_metrics } of data.metrics) {
      for (const entry of model_metrics) {
        const count = map.get(entry.model_id) ?? 0;
        map.set(entry.model_id, count + entry.count);
      }
    }

    // Return the array of datums.
    return Array.from(map.entries(), ([name, value]) => ({ name, value }));
  }
}
