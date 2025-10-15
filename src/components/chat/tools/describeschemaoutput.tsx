import type { ReactNode } from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";


function JsonView(props: {
  jsonOpen: boolean;
  setJsonOpen: React.Dispatch<React.SetStateAction<boolean>>;
  jsonStr: string;
}): ReactNode {
  const { jsonOpen, setJsonOpen, jsonStr } = props;

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-xs underline"
        onClick={() => setJsonOpen((v) => !v)}
        aria-expanded={jsonOpen}
      >
        {jsonOpen ? "Collapse JSON" : "Expand JSON"}
      </button>

      {/* Collapsed: short, Expanded: taller — both scroll independently */}
      <div
        className={`border rounded p-2 bg-white/50 ${
          jsonOpen ? "h-96" : "h-24"
        } overflow-auto`}
      >
        <pre className="text-xs whitespace-pre break-words min-w-0">
          {jsonStr}
        </pre>
      </div>
    </div>
  );
}

function ChartView(props: {
  // config & data
  keys: string[];
  grouped: Record<string, any[]> | null;
  sorted: any[];
  // selections
  xField: string;
  setXField: (v: string) => void;
  yField: string;
  setYField: (v: string) => void;
  activeGroup: string;
  setActiveGroup: (v: string) => void;
  groupLabels: string[];
}): ReactNode {
  const {
    keys,
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

  // local canvas ref + chart lifecycle
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartCanvasRef.current || !xField || !yField) return;

    const rows = grouped ? grouped[activeGroup] ?? [] : sorted;
    const labels = rows.map((r: any) => String(r?.[xField] ?? ""));
    const values = rows.map((r: any) => Number(r?.[yField]));

    const chart = new Chart(chartCanvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: `${yField} by ${xField}`, data: values }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    return () => chart.destroy();
  }, [grouped, sorted, xField, yField, activeGroup]);

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
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
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
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
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
              {groupLabels.map((g) => (
                <option key={g} value={g}>{g || "(empty)"}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="h-64">
        <canvas ref={chartCanvasRef} />
      </div>
    </div>
  );
}

function Table(props: { keys: string[]; rows: any[] }): ReactNode {
  const { keys, rows } = props;

  return (
    <div className="overflow-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k} className="border px-2 py-1 text-left font-medium">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k} className="border px-2 py-1 align-top break-words">
                  {String((row as any)?.[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DescribeSchemaOutput(props: DescribeSchemaOutput.Props): ReactNode {
  const { part } = props;
  const output = part?.data?.output;

  // dynamic keys from the first row
  const keys = useMemo(() => {
    const first = output[0];
    return first && typeof first === "object" ? Object.keys(first) : [];
  }, [output]);

  // controls state
  const [sortKey, setSortKey] = useState<string>("");
  const [groupKey, setGroupKey] = useState<string>("");
  const [view, setView] = useState<"json" | "table" | "chart">("json");
  const [jsonOpen, setJsonOpen] = useState<boolean>(true);

  useEffect(() => {
    if (sortKey && !keys.includes(sortKey)) setSortKey("");
    if (groupKey && !keys.includes(groupKey)) setGroupKey("");
  }, [keys, sortKey, groupKey]);

  // sorting
  const sorted = useMemo(() => {
    if (!sortKey) return output;
    // making a shallow copy so we are not sorting the original array
    const copy = [...output];
    copy.sort((a: any, b: any) => {
      const aVal = a?.[sortKey];
      const bVal = b?.[sortKey];
      return String(aVal ?? "").localeCompare(String(bVal ?? ""));
    });
    return copy;
  }, [output, sortKey]);

  // grouping
  const grouped = useMemo(() => {
    if (!groupKey) return null;
    
    const map = new Map<string, any[]>();
    for (const row of sorted) {
      if (!row || typeof row !== "object") continue;
      const key = String((row as any)[groupKey] ?? "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Object.fromEntries(map.entries());
  }, [sorted, groupKey]);

  const jsonStr = useMemo(
    () => JSON.stringify(grouped ?? sorted, null, 2),
    [grouped, sorted]
  );

  // Chart management selections (kept in parent so they persist with view)
  const [xField, setXField] = useState<string>(keys[0] ?? "");
  const [yField, setYField] = useState<string>(
    keys.find((k) => typeof (output[0] as any)?.[k] === "number") ?? ""
  );
  const groupLabels = useMemo(() => (grouped ? Object.keys(grouped) : []), [grouped]);
  const [activeGroup, setActiveGroup] = useState<string>("");

  // Keep selected fields valid when available keys change
  useEffect(() => {
    if (!keys.includes(xField)) setXField(keys[0] ?? "");

    if (!keys.includes(yField)) {
      const firstNumericKey = keys.find((k) => typeof (output[0] as any)?.[k] === "number");
      setYField(firstNumericKey ?? "");
    }
  }, [keys, xField, yField, output]);

  useEffect(() => {
    if (!grouped) {
      setActiveGroup("");
      return;
    }
    if (!activeGroup || !groupLabels.includes(activeGroup)) {
      setActiveGroup(groupLabels[0] ?? "");
    }
  }, [grouped, groupLabels, activeGroup]);

  return (
    <div className="space-y-2">
      {/* Controls: sort, group, view (view is 3rd) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <span>Sort by:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="">(none)</option>
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>Group by:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value)}
          >
            <option value="">(none)</option>
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>View:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={view}
            onChange={(e) => setView(e.target.value as any)}
          >
            <option value="json">json</option>
            <option value="table">table</option>
            <option value="chart">chart</option>
          </select>
        </label>
      </div>

      {view === "json" && (
        <JsonView jsonOpen={jsonOpen} setJsonOpen={setJsonOpen} jsonStr={jsonStr} />
      )}

      {/* Table view (respects sort + group) */}
      {view === "table" && (
        <>
          {!grouped && <Table keys={keys} rows={sorted} />}
          {grouped &&
            Object.entries(grouped).map(([g, rows]) => (
              <div key={g} className="space-y-1">
                <div className="text-xs font-medium">{g || "(empty)"}</div>
                <Table keys={keys} rows={rows as any[]} />
              </div>
            ))}
        </>
      )}

      {/* Chart view (respects sort; if grouped, pick a group) */}
      {view === "chart" && (
        <ChartView
          keys={keys}
          grouped={grouped}
          sorted={sorted}
          xField={xField}
          setXField={setXField}
          yField={yField}
          setYField={setYField}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          groupLabels={groupLabels}
        />
      )}
    </div>
  );
}

export const DescribeSchemaOutputMemo = memo(DescribeSchemaOutput);

export namespace DescribeSchemaOutput {
  export type Props = {
    part: any;
  };
}

