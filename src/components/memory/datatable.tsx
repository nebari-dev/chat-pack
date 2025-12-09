"use client";

import * as React from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Button
} from "@/components/ui/button";


export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteSelected,
}: DataTable.Props<TData, TValue>) {

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [deleting, setDeleting] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      sorting,
    },
  });

  // Convenience values derived from the table:
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const showSelectionBar = selectedCount > 0;

  // Clears all selected rows.
  function handleClearSelection() {
    table.resetRowSelection();
  }

  async function handleDeleteSelection() {
    if (!onDeleteSelected || !selectedRows.length) return;

    setDeleting(true);
    try {
      const originals = selectedRows.map(r => r.original as TData);
      await onDeleteSelected(originals);
      table.resetRowSelection();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <div className="rounded border border-border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Table body: all rows and cells */}
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty state when there are no rows
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No memories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection pop-up that let's the user delete selected memories */}
      {showSelectionBar && (
        <div className="flex fixed bottom-4 justify-self-center max-w-md items-center gap-4 rounded-md border px-4 py-2 shadow-lg z-1">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground mr-1">
              {selectedCount}
            </span>{" "}
            item{selectedCount > 1 ? "s" : ""} selected
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              disabled={deleting}
            >
              Clear selection
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelection}
              disabled={!onDeleteSelected || deleting}
            >
              {deleting ? "Deleting..." : "Delete selection"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export namespace DataTable {
  export type Props<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onDeleteSelected?: (rows: TData[]) => void | Promise<void>; 
  }
}