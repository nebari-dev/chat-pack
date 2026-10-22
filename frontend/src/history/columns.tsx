/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataTableColumnDef } from '@/components/ui/data-table';
import { formatDateTime, formatRelativeTime } from '@/lib/time';

/**
 * One row of the history table.
 */
export type HistoryRow = {
  readonly id: string;
  readonly name: string;
  readonly agentName: string;
  readonly updatedAt: string;
  readonly createdAt: string;
};

/**
 * Build the history table columns.
 *
 * @param onDelete - Called with a row the user wants to delete.
 * @returns The column definitions.
 */
export function historyColumns(
  onDelete: (row: HistoryRow) => void,
): DataTableColumnDef<HistoryRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Conversation',
      sortFn: 'text',
      filterFn: 'includesString',
      cell: ({ row }) => (
        <Link
          to="/chat"
          search={{ threadId: row.original.id }}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'agentName',
      header: 'Agent',
      sortFn: 'text',
      cell: ({ row }) => (
        <Badge variant="secondary" className="whitespace-nowrap">
          {row.original.agentName}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      sortFn: 'text',
      cell: ({ row }) => (
        <time
          dateTime={row.original.updatedAt}
          title={formatDateTime(row.original.updatedAt)}
          className="whitespace-nowrap text-muted-foreground-strong"
        >
          {formatRelativeTime(row.original.updatedAt)}
        </time>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${row.original.name}`}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
}
