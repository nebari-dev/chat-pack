import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function MetricsLineChart({
  title,
  description,
  total,
  data,
  series,
  xTickFormatter,
}: MetricsLineChart.Props) {
  const chartConfig: ChartConfig = series.reduce(
    (acc, s) => {
      acc[s.key] = {
        label: s.label,
      };
      return acc;
    },
    {} as ChartConfig,
  );

  // Any non-zero value across any series = "has data"
  const hasData = data.some((d) =>
    series.some((s) => Number(d[s.key] ?? 0) > 0),
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>

          <div className="text-lg font-semibold opacity-80">
            {hasData && typeof total === "number" ? total.toLocaleString() : "-"}
          </div>
        </div>

        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pl-0 pt-0 pb-2 overflow-hidden">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-xs opacity-70">
            NO DATA AVAILABLE YET
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
                top: 4,
                bottom: 4,
              }}
            >
              <CartesianGrid vertical={false} />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, "dataMax"]}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={xTickFormatter}
              />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />

              {series.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  type="linear"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export namespace MetricsLineChart {
  export type MetricsLineDatum = {
    label: string;
    [key: string]: string | number;
  };

  export type MetricsLineSeries = {
    key: string;
    label: string;
  };

  export type Props = {
    title: string;
    description?: string;
    total?: number;
    data: MetricsLineDatum[];
    series: MetricsLineSeries[];
    xTickFormatter?: (value: string | number) => string;
  };
}
