/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as echarts from 'echarts';

import type { ReactNode } from 'react';

import { useEffect, useRef } from 'react';

/**
 * Recursively parse JSON-encoded string values within an echart option.
 *
 * Some agents emit nested option objects (e.g. `grid`) as JSON strings rather
 * than parsed objects. echarts' compat layer then runs the `in` operator over
 * the string primitive and throws, taking down the chart. This walks the option
 * and replaces any string that decodes to an object/array with the parsed value.
 * It also returns a fresh tree, which avoids mutating the (frozen) store object
 * that echarts would otherwise write to during `setOption`.
 */
function normalizeOption(value: unknown): unknown {
  // Parse strings that encode a JSON object or array back into a value.
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return normalizeOption(JSON.parse(trimmed));
      } catch {
        // Not valid JSON (e.g. a `{b}: {c}` formatter); keep the original.
        return value;
      }
    }
    return value;
  }

  // Recurse into arrays.
  if (Array.isArray(value)) {
    return value.map(normalizeOption);
  }

  // Recurse into plain objects.
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = normalizeOption(val);
    }
    return result;
  }

  return value;
}

/**
 * The echart components that the compat layer runs the `in` operator over.
 *
 * If any of these is given a primitive (e.g. a string `title`), echarts throws
 * `Cannot use 'in' operator ...` and the chart fails to render.
 */
const LAYOUT_COMPONENTS = [
  'grid',
  'geo',
  'parallel',
  'legend',
  'toolbox',
  'title',
  'visualMap',
  'dataZoom',
  'timeline',
];

/**
 * Coerce primitive layout components into the object shape echarts expects.
 *
 * Some agents emit shorthand values such as `title: "Austin Permits by Year"`
 * rather than `title: { text: "..." }`. A string `title` is coerced to its
 * object form; other primitives are dropped so echarts' compat layer does not
 * crash. Mutates and returns the (already fresh) normalized option.
 */
function coerceComponents(option: Record<string, unknown>): void {
  for (const key of LAYOUT_COMPONENTS) {
    const value = option[key];

    // Skip absent components.
    if (value == null) {
      continue;
    }

    // Work over a list so single and array forms share one code path.
    const wasArray = Array.isArray(value);
    const items = wasArray ? (value as unknown[]) : [value];

    // Coerce or drop each item.
    const fixed = items
      .map((item) => {
        // Objects are already valid component configs.
        if (item !== null && typeof item === 'object') {
          return item;
        }

        // A string title is shorthand for its text.
        if (key === 'title') {
          return { text: String(item) };
        }

        // Any other primitive would crash echarts; drop it.
        return undefined;
      })
      .filter((item) => item !== undefined);

    // Restore the original single/array shape, or drop the component entirely.
    if (fixed.length === 0) {
      delete option[key];
    } else {
      option[key] = wasArray ? fixed : fixed[0];
    }
  }
}

/**
 * A react component that renders an EChart.
 */
export function EChartRenderer(props: EChartRenderer.Props): ReactNode {
  // Extract the echart option.
  const { option, className } = props;

  // Create the ref for the chart container node.
  const ref = useRef<HTMLDivElement>(null);

  // Create the ref for the chart instance.
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Setup the effect to create and dispose the chart instance.
  useEffect(() => {
    // Fetch the chart container node.
    const node = ref.current!;

    // Initialize the chart.
    const chart = echarts.init(node);

    // Store the chart instance.
    chartRef.current = chart;

    // Track any pending resize frame so it can be cancelled on cleanup.
    let resizeFrame = 0;

    // Create the resize observer. Defer to an animation frame so resize is
    // never invoked during echarts' main process (which logs a warning).
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (!chart.isDisposed()) {
          chart.resize();
        }
      });
    });

    // Observe the chart container.
    observer.observe(node);

    // Return the disposer function.
    return () => {
      // Cancel any pending resize frame.
      cancelAnimationFrame(resizeFrame);

      // Disconnect the resize observer.
      observer.disconnect();

      // Dispose the chart.
      chart.dispose();

      // Clear the chart instance.
      chartRef.current = null;
    };
  }, []);

  // Setup the effect to apply the option to the chart.
  useEffect(() => {
    // Fetch the chart instance.
    const chart = chartRef.current;

    // Bail if the chart is not initialized.
    if (!chart) {
      return;
    }

    // Apply the normalized option, failing soft on malformed payloads.
    try {
      const normalized = normalizeOption(option) as Record<string, unknown>;
      coerceComponents(normalized);
      chart.setOption(normalized as echarts.EChartsOption, true);
    } catch (error) {
      console.error('Failed to render chart option:', error);
    }
  }, [option]);

  // Return the rendered component.
  return <div ref={ref} className={className} />;
}

/**
 * The namespace for the `EChartRenderer` statics.
 */
export namespace EChartRenderer {
  /**
   * A type alias for the `EChartRenderer` props.
   */
  export type Props = {
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
