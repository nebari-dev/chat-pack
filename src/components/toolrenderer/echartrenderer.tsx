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
 * A react component that renders an EChart tool result.
 *
 * This renders the 'application/vnd.openteams-echart' mime type.
 */
export
function EChartRenderer(props: EChartRenderer.Props): ReactNode {
  // Extract the echart option.
  const option = props.result.data.option;

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
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      chart.resize({ width, height });
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
  return (
    <div  ref={ ref } className='h-120 mb-4 border p-4 rounded-md' />
  );
}


/**
 * The namespace for the `EChartRenderer` statics.
 */
export
namespace EChartRenderer {
  /**
   * A type alias for an echart mime result.
   */
  export
  type MimeResult = {
    /**
     * The known mime type for the result.
     */
    readonly mimeType: 'application/vnd.openteams-echart';

    /**
     * The data payload for the result.
     */
    readonly data: {
      /**
       * The option object for configuring the echart.
       */
      readonly option: echarts.EChartsOption;
    };
  };

  /**
   * A type alias for the `EChartRenderer` props.
   */
  export
  type Props = {
    /**
     * The tool call result for rendering an echart.
     */
    readonly result: MimeResult;
  };
}
