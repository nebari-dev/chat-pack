/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as echarts from 'echarts';

import type {
  ReactNode
} from 'react';

import {
  useEffect, useRef
} from 'react';

import {
  pb
} from '@/api/pb';

import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';

import {
  cn
} from '@/lib/utils';

import londonGeoJSON from './london.json';


/**
 * A react component that renders the tracks chart.
 */
export
function Tracks(props: Tracks.Props): ReactNode {
  // Extract the props.
  const { className } = props;

  // Return the rendered component.
  return (
    <Card className={ cn(
      'min-w-0 min-h-40 gap-2 py-4 rounded-sm', className) }>
      <CardHeader className='px-4'>
        <CardTitle>
          Vehicular Tracks Over London
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 grow min-h-0'>
        <Private.TracksChart />
      </CardContent>
    </Card>
  );
}


/**
 * The namespace for the tracks statics.
 */
export
namespace Tracks {
  /**
   * A type alias for the `Tracks` props.
   */
  export
  type Props = {
    /**
     * The class name to add to the component.
     */
    readonly className?: string;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the track state.
   */
  type TrackState = {
    readonly track_id: string;
    readonly x: number;
    readonly y: number;
    readonly vx: number;
    readonly vy: number;
    readonly classification: string;
    readonly track_confidence: number;
    readonly last_ts: string;
  };

  // Register the London GeoJSON with echarts.
  //
  // TypeScript LSP calls this a type error, but it works. Hence the `any`.
  echarts.registerMap('london', londonGeoJSON as any);

  // The longitude of london center, in decimal deg format.
  const LONDON_CENTER_X = -0.1276;

  // The latituded of london center, in decimal deg format.
  const LONDON_CENTER_Y = 51.5073;

  // The latituded of london center, in radian format.
  const LONDON_LAT_RAD = 0.8990;

  // The base size of the incursion ring in pixels.
  //
  // This is multiplied by zoom level on georoam to keep it consistent
  // when zooming.
  //
  // TODO adjust this as needed to get an approximation of km radius needed.
  const INCURSION_RING_SIZE = 75;

  /**
   * The base option for the tracks chart.
   */
  const baseOption: echarts.EChartsOption = {
    animation: false,
    geo: {
      id: 'london',
      map: 'london',
      roam: true,
      center: [LONDON_CENTER_X, LONDON_CENTER_Y],
      itemStyle: {
        areaColor: '#e7e8ea'
      }
    },
    dataset: {
      source: []
    },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        id: 'incursion-ring',
        type: 'scatter',
        coordinateSystem: 'geo',
        silent: true,
        symbolSize: INCURSION_RING_SIZE,
        data: [
          {
            value: [LONDON_CENTER_X, LONDON_CENTER_Y],
            itemStyle: {
              color: 'rgba(0, 0, 255, 0.2)',
              borderColor: 'rgba(0, 0, 255, 0.8)',
              borderWidth: 2
            }
          }
        ]
      },
      {
        type: 'scatter',
        symbol: 'triangle',
        coordinateSystem: 'geo',
        itemStyle: {
          color: 'rgba(255, 0, 0)'
        },
        encode: {
          lng: 'x',
          lat: 'y'
        }
      }
    ]
  };

  /**
   * Convert a `TrackState` from the API into lat/lng coordinates.
   *
   * This uses london center as the basis for tranlating the offsets.
   */
  function convertToLatLong(state: TrackState): TrackState {
    // Convert the X offset.
    const x = state.x / (111139 * Math.cos(LONDON_LAT_RAD)) + LONDON_CENTER_X;

    // Convert the Y offset.
    const y = state.y / 111139 + LONDON_CENTER_Y;

    // Return the converted state.
    return { ...state, x, y };
  }

  /**
   * A react component that renders the tracks chart.
   */
  export
  function TracksChart(): ReactNode {
    // Create the ref for mounting the chart component.
    const ref = useRef<HTMLDivElement>(null);

    // Setup the effect to create the chart.
    useEffect(() => {
      // Fetch the chart container node.
      const node = ref.current!;

      // Initialize the chart.
      const chart = echarts.init(node);

      // Set the base option for the chart.
      chart.setOption(baseOption);

      // Create a handler to track the georoam zoom level.
      chart.on('georoam', (params: any) => {
        if (typeof params.totalZoom === 'number') {
          chart.setOption({
            series: [
              {
                id: 'incursion-ring',
                symbolSize: INCURSION_RING_SIZE * params.totalZoom
              }
            ]
          });
        }
      });

      // Create the polling function for updating the data source.
      const poller = async () => {
        // Fetch the resource.
        const resp = await fetch('/api/api/state/tracks', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pb.authStore.token}`
          },
        });

        // Guard against request failure.
        if (!resp.ok) {
          throw new Error(`Response: ${resp.status} ${resp.statusText}`);
        }

        // Convert the response to JSON.
        const json = await resp.json();

        // Convert the JSON to data. Assume the format is correct.
        const data = json as TrackState[];

        // Convert the raw x/y data to lat/lng decimals.
        const converted = data.map(convertToLatLong);

        // Update the chart with new data.
        chart.setOption({ dataset: { source: converted } });
      };

      // Setup the polling interval.
      const intervalId = setInterval(poller, 2000);

      // Create the resize observer.
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        chart.resize({ width, height });
      });

      // Observe the chart container.
      observer.observe(node);

      // Return the disposer function.
      return () => {
        // Stop the poller.
        clearInterval(intervalId);

        // Dispose the chart.
        chart.dispose();

        // Disconnect the resize observer.
        observer.disconnect();
      };
    }, []);

    // Return the rendered component.
    return <div ref={ ref } className='h-full w-full border rounded-md' />;
  }
}
