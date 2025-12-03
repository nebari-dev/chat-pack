import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
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

export function MetricsBarChart({
  title,
  description,
  total,
  data,
  series,
  stackId = "stack",
}: MetricsBarChart.Props) {
  const chartConfig: ChartConfig = series.reduce(
    (acc, s, index) => {
      const color = `var(--chart-${index + 1})`

      acc[s.key] = {
        label: s.label,
        color,
      };
      return acc;
    },
    {} as ChartConfig,
  );

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

      <CardContent className="flex-1 min-h-0 pl-0 pt-0 pb-2">
        <ChartContainer config={chartConfig} className="w-full h-full">
          {!hasData ? (
            <div className="flex h-full items-center justify-center text-xs">
              NO DATA AVAILABLE YET
            </div>
          ) : (
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                }}
                domain={[0, "dataMax"]}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />

              <ChartTooltip content={<ChartTooltipContent hideLabel />} />

              <ReferenceLine y={0} stroke="var(--border)" />

              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId={stackId}
                  fill={`var(--color-${s.key})`}
                />
              ))}
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export namespace MetricsBarChart {
  export type MetricsBarDatum = {
    label: string;
    [key: string]: string | number;
  };

  export type MetricsBarSeries = {
    key: string;
    label: string;
  };

  export type Props = {
    title: string;
    description?: string;
    total?: number;
    data: MetricsBarDatum[];
    series: MetricsBarSeries[];
    stackId?: string;
  };
}
