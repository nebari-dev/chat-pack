/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * Resolve a CSS custom property on `<html>` to an `rgb()`/`rgba()` string.
 *
 * The Nebari tokens are `oklch()` values, which ECharts cannot parse (it
 * derives hover and emphasis shades from the colors it is given). Painting
 * the token onto a 1×1 canvas and reading the pixel back converts any CSS
 * color the browser understands into plain sRGB.
 */
function resolveToken(name: string, context: CanvasRenderingContext2D): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = '#000';
  context.fillStyle = value || '#000';
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return a === 255
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

/**
 * Build an ECharts theme from the active Nebari theme tokens.
 *
 * Series use the `--chart-1`…`--chart-5` palette, and titles, axes,
 * gridlines, labels and tooltips use the foreground, muted, border and
 * popover tokens, so charts match the app in light and dark mode. Call it
 * again after the theme changes; the tokens are read at call time.
 *
 * @returns The theme object to pass to `echarts.init`.
 */
export function nebariChartTheme(): Record<string, unknown> {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {};
  }
  const token = (name: string) => resolveToken(name, context);

  const foreground = token('--foreground');
  const muted = token('--muted-foreground');
  const mutedStrong = token('--muted-foreground-strong');
  const border = token('--border');
  const fontFamily = getComputedStyle(document.body).fontFamily;

  const axis = {
    axisLine: { lineStyle: { color: border } },
    axisTick: { lineStyle: { color: border } },
    axisLabel: { color: muted },
    splitLine: { lineStyle: { color: border, type: 'dashed' } },
    nameTextStyle: { color: muted },
  };

  return {
    color: [
      '--chart-1',
      '--chart-2',
      '--chart-3',
      '--chart-4',
      '--chart-5',
    ].map(token),
    backgroundColor: 'transparent',
    textStyle: { fontFamily, color: mutedStrong },
    title: {
      textStyle: { color: foreground, fontWeight: 600 },
      subtextStyle: { color: muted },
    },
    legend: { textStyle: { color: mutedStrong } },
    tooltip: {
      backgroundColor: token('--popover'),
      borderColor: border,
      textStyle: { color: token('--popover-foreground') },
    },
    categoryAxis: axis,
    valueAxis: axis,
    logAxis: axis,
    timeAxis: axis,
    bar: { label: { color: mutedStrong } },
    line: { label: { color: mutedStrong } },
    pie: { label: { color: mutedStrong } },
  };
}
