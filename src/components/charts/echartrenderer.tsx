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


/**
 * A react component that renders an EChart.
 */
export
function EChartRenderer(props: EChartRenderer.Props): ReactNode {
  // Extract the echart option.
  const { option, className } = props;

  // Create the ref the chart node.
  const ref = useRef<HTMLDivElement>(null);

  // Setup the effect to create the chart.
  useEffect(() => {
    // Fetch the chart container node.
    const node = ref.current!;

    // Initialize the chart.
    const chart = echarts.init(node);

    // Set the chart option.
    chart.setOption(option);

    // Create the resize observer.
    const observer = new ResizeObserver(() => {
      chart.resize();
    });

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
  return <div ref={ ref } className={ className } />;
}


/**
 * The namespace for the `EChartRenderer` statics.
 */
export
namespace EChartRenderer {
  /**
   * A type alias for the `EChartRenderer` props.
   */
  export
  type Props = {
    /**
     * The option object for configuring the echart.
     */
    readonly option: echarts.EChartsOption;

    /**
     * The classname for configuring the echart div.
     */
    readonly className?: string;
  };
}
