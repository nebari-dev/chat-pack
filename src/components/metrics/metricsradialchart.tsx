import {
  Label as RechartsLabel,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function MetricsRadialChart({
  title,
  description,
  centerLabel,
  data,
  series,
}: MetricsRadialChart.Props) {
  const chartData = [data];

  const chartConfig: ChartConfig = series.reduce((acc, s, index) => {
    const color = `var(--chart-${index + 1})`;
    acc[s.key] = {
      label: s.label,
      color,
    };
    return acc;
  }, {} as ChartConfig);

  const values = series.map((s, index) => {
    const value = Number(data[s.key]) || 0;
    // At the moment the color is set to option 3 just so all the charts are more colorfull
    // Replace the index to + 1 if more than 3 options are expected
    const color = `var(--chart-${index + 3})`;
    return { ...s, value, color };
  });

  const total = values.reduce((sum, v) => sum + v.value, 0);
  const hasData = total > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>

          <div className="text-lg font-semibold opacity-80">
            {hasData && typeof total === "number" ? total.toLocaleString() : "-"}
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex flex-1 items-center justify-center pb-0">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[250px]"
          >
            <RadialBarChart
              data={chartData}
              endAngle={180}
              innerRadius={80}
              outerRadius={130}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />

              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <RechartsLabel
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground text-xs"
                          >
                            {centerLabel}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </PolarRadiusAxis>

              {values.map((v) => (
                <RadialBar
                  key={v.key}
                  dataKey={v.key}
                  stackId="a"
                  cornerRadius={5}
                  fill={v.color}
                  className="stroke-transparent stroke-2"
                />
              ))}
              </RadialBarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs opacity-70">
            NO DATA AVAILABLE YET
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-1 text-xs">
        {values.map((v) => (
          <div key={v.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: v.color }}
              />
              <span>{v.label}</span>
            </div>
            <span className="font-medium">
              {v.value > 0 ? v.value.toLocaleString() : "-"}
            </span>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}

export namespace MetricsRadialChart {
  export type Series = {
    key: string;
    label: string;
  };

  export type Data = Record<string, number>;

  export type Props = {
    title: string;
    description?: string;
    centerLabel: string;
    data: Data;
    series: Series[];
  };
}
