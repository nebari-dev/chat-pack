import type { ReactNode } from "react";
import { memo, useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import type { AnyRow } from "./austinpermits-types";

export function ChartView(props: ChartView.Props): ReactNode {
  const {
    keys: columnNames,
    grouped,
    sorted,
    xField,
    setXField,
    yField,
    setYField,
    activeGroup,
    setActiveGroup,
    groupLabels,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !xField || !yField) return;

    const rows: AnyRow[] = grouped ? grouped[activeGroup] ?? [] : sorted;
    const labels = rows.map((row) => String((row as any)[xField] ?? ""));
    const values = rows.map((row) => Number((row as any)[yField]));

    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: { labels, datasets: [{ label: `${yField} by ${xField}`, data: values }] },
      options: { responsive: true, maintainAspectRatio: false },
    });

    return () => chart.destroy();
  }, [grouped, sorted, xField, yField, activeGroup]);

  const availableGroups = useMemo(() => groupLabels, [groupLabels]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <span>x:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={xField}
            onChange={(e) => setXField(e.target.value)}
          >
            {columnNames.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>y:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={yField}
            onChange={(e) => setYField(e.target.value)}
          >
            {columnNames.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </label>

        {grouped && (
          <label className="flex items-center gap-1">
            <span>group:</span>
            <select
              className="border rounded px-1 py-0.5"
              value={activeGroup}
              onChange={(e) => setActiveGroup(e.target.value)}
            >
              {availableGroups.map((g) => (
                <option key={g} value={g}>{g || "(empty)"}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="h-64">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export const ChartViewMemo = memo(ChartView) as typeof ChartView;

export namespace ChartView {
  export type Props = {
    /** Column names available for selection */
    keys: string[];

    /** Optional grouped rows keyed by group label */
    grouped: Record<string, AnyRow[]> | null;
    sorted: AnyRow[];

    /** Field names for axes */
    xField: string;
    setXField: (v: string) => void;
    yField: string;
    setYField: (v: string) => void;

    /** Active group selection when `grouped` is provided */
    activeGroup: string;
    setActiveGroup: (v: string) => void;

    /** List of available group labels */
    groupLabels: string[];
  };
}
