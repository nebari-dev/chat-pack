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
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';


/**
 * A React component that renders an echart as a card.
 */
export
function ChartCard(props: ChartCard.Props): ReactNode {
  // Extract the props.
  const { title, description, option } = props;

  // Create the ref the chart node.
  const ref = useRef<HTMLDivElement>(null);

  // Setup the effect to create the chart.
  useEffect(() => {
    // Fetch the chart container.
    const node = ref.current!;

    // Initialize the chart.
    const chart = echarts.init(node);

    // Set the chart option.
    chart.setOption(option);

    // Create the resize observer.
    const observer = new ResizeObserver(() => { chart.resize(); });

    // Observe the chart container.
    observer.observe(node);

    // Return the disposer function.
    return () => {
      // Dispose the chart.
      chart.dispose();

      // Disconnect the resize observer.
      observer.disconnect();
    };
  }, [option]);

  // Return the rendered component.
  return (
    <Card className='min-h-80'>
      <CardHeader>
        <CardTitle>
          { title }
        </CardTitle>
        <CardDescription>
          { description }
        </CardDescription>
      </CardHeader>
      <CardContent className='grow'>
        <div className='w-full h-full' ref={ ref } />
      </CardContent>
    </Card>
  );
}


/**
 * The namespace for the `ChartCard` component statics.
 */
export
namespace ChartCard {
  /**
   * A type alias for the echarts `EChartsOption`.
   */
  export
  type Option = echarts.EChartsOption;

  /**
   * A type alias for the `ChartCard` props.
   */
  export
  type Props = {
    /**
     *
     */
    readonly title: string;

    /**
     *
     */
    readonly description: string;

    /**
     * The title for the chart card.
     */
    readonly option: Option;
  };
}
