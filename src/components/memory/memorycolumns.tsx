"use client";

import type {
  ColumnDef
} from "@tanstack/react-table";

import {
  Checkbox
} from "@/components/ui/checkbox";

import {
  ChevronDown, ChevronUp
} from 'lucide-react';

import * as api from "@/api";

/**
 * Column definitions for the Memories table.
 * These are consumed by the generic <DataTable /> component.
 */
export const MemoryColumns: ColumnDef<api.MemoryItem>[] = [
  // Selection column (checkboxes)
  // - Header: "select all on this page"
  // - Cell: select a single row
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        // true  -> all rows on this page selected
        // "indeterminate" -> some but not all selected
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },


  // Memory text column
  // - Shows the main memory string with wrapping
  {
    accessorKey: "memory",
    header: "Memory",
    cell: ({ row }) => (
      <p className="max-w-xl whitespace-pre-wrap break-words">
        {row.original.memory}
      </p>
    ),
  },

  // Topics column
  // - Renders topics as small "pills"
  // - If there are no topics, shows "(no topics)"
  {
    accessorKey: "topics",
    header: "Topics",
    cell: ({ row }) => {
      const topics = row.original.topics ?? [];

      if (topics.length === 0) {
        return (
          <span className="text-xs text-muted-foreground">
            (no topics)
          </span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {topics.map((topic: string) => (
            <span
              key={topic}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
            >
              {topic}
            </span>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },

  // Updated-at timestamp column
  // - Converts ISO string to a human-readable local time
  // - If missing, shows "-"
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return (
        <button
          type="button"
          className="inline-flex items-center gap-1"
          onClick={() =>
            column.toggleSorting(
              isSorted === "asc"
            )
          }
        >
          <span>Updated at</span>
          {isSorted === "asc" && (
            <ChevronUp size={14} className="text-muted-foreground" />
          )}
          {isSorted === "desc" && (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const value = row.original.updated_at;
      const date = value ? new Date(value) : null;

      return (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {date ? date.toLocaleString() : "-"}
        </span>
      );
    },
    enableSorting: true,
  },
];
