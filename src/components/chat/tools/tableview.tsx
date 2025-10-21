import type {
  ReactNode
} from "react";

import {
  memo
} from "react";

import type {
  AnyRow
} from "./austinpermits-types";

export function TableView(props: TableView.Props): ReactNode {
  const { keys, rows } = props;

  // Safe indexer for union row types
  const getCell = (row: AnyRow, key: string): unknown =>
    (row as unknown as Record<string, unknown>)[key];

  return (
    <div className="overflow-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            {keys.map((col) => (
              <th key={col} className="border px-2 py-1 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {keys.map((col) => (
                <td key={col} className="border px-2 py-1 align-top break-words">
                  {String(getCell(row, col) ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const TableViewMemo = memo(TableView);

export
namespace TableView {
  
  export
  type Props = {
    keys: string[];
    rows: AnyRow[];
  };
}
