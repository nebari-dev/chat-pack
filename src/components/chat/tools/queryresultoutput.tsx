import type {
  ReactNode
} from "react";

import {
  memo, useMemo, useState
} from "react";

import {
  TableView, FallbackOutputMemo
} from ".";

import type {
  AnyRow
} from "./austinpermits-types";

export function QueryResultOutput(props: QueryResultOutput.Props): ReactNode {
  const { part } = props;

  const output = part?.data?.output

  // Error rendering. If output comes back as a string it is an error and we can cut it here
  if (typeof output === "string") {
    return (
      <div className="space-y-2">
        <FallbackOutputMemo data={output} />
      </div>
    );
  }

  // get all the keys from the data for sorting and grouping
  const columns = useMemo<string[]>(
    () => Object.keys((output as AnyRow[] | undefined)?.[0] ?? {}),
    [output]
  );

  // UI state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [groupColumn, setGroupColumn] = useState<string>("");
  const [viewType, setViewType] = useState<"json" | "table">("json");
  const isGrouped = Boolean(groupColumn);
  const isJson = viewType === "json";

  // Sort (numeric when both numbers; otherwise string compare)
  const sortedRows = useMemo<AnyRow[]>(() => {
    const rows = (output as AnyRow[]) ?? [];
    if (!sortColumn) return rows;

    const copy = [...rows];
    copy.sort((rowA, rowB) => {
      const aValue = (rowA as any)[sortColumn];
      const bValue = (rowB as any)[sortColumn];

      const aNumber = Number(aValue);
      const bNumber = Number(bValue);

      const bothNumbers = Number.isFinite(aNumber) && Number.isFinite(bNumber);
      if (bothNumbers) return aNumber - bNumber;

      return String(aValue ?? "").localeCompare(String(bValue ?? ""));
    });

    return copy;
  }, [output, sortColumn]);

  // Group (for table view)
  const groupedBySelectedField = useMemo<Record<string, AnyRow[]>>(() => {
    if (!groupColumn) return {};
    const groups: Record<string, AnyRow[]> = {};
    for (const row of (sortedRows as AnyRow[])) {
      const groupKey = String((row as any)[groupColumn] ?? "");
      (groups[groupKey] ??= []).push(row);
    }
    return groups;
  }, [sortedRows, groupColumn]);

  // Data that will be passed to the json renderer.
  // Allows sorting and grouping to be shown in json view
  const jsonData = isGrouped ? groupedBySelectedField : sortedRows;

  const tableContent =
  viewType !== "table"
    ? null
    : isGrouped
      ? Object.entries(groupedBySelectedField).map(([groupKey, groupRows]) => (
          <div key={groupKey} className="space-y-1">
            <div className="text-xs font-medium">{groupKey || "(empty)"}</div>
            <TableView keys={columns} rows={groupRows} />
          </div>
        ))
      : <TableView keys={columns} rows={sortedRows} />;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <span>Sort by:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={sortColumn}
            onChange={(e) => setSortColumn(e.target.value)}
          >
            <option value="">(none)</option>
            {columns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>Group by:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={groupColumn}
            onChange={(e) => setGroupColumn(e.target.value)}
          >
            <option value="">(none)</option>
            {columns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>View:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={viewType}
            onChange={(e) => setViewType(e.target.value as "json" | "table")}
          >
            <option value="json">json</option>
            <option value="table">table</option>
          </select>
        </label>
      </div>

      {isJson && <FallbackOutputMemo data={jsonData} />}
      {tableContent}
    </div>
  );
}

export const QueryResultOutputMemo = memo(QueryResultOutput);

export
namespace QueryResultOutput {

  export
  type Props = {
    part: { data?: { output?: AnyRow[] | string } };
  };
}
