/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Pencil, Trash2 } from 'lucide-react';

import type { ReactNode } from 'react';

import { useMemo } from 'react';

import * as api from '@/api';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAgents, useAgentsConfig } from '@/context';

import { AgentKindBadge } from './kindbadge';

/**
 * A React component that renders the agents table.
 */
export function AgentsTable(props: AgentsTable.Props): ReactNode {
  // Extract the props.
  const { onDelete } = props;

  // Fetch the agents and the page config.
  const agents = useAgents();
  const { canWrite, canDelete } = useAgentsConfig();

  // Create the column definitions, which close over the action handlers.
  const columns = useMemo(
    () => Private.makeColumns({ canWrite, canDelete, onDelete }),
    [canWrite, canDelete, onDelete],
  );

  // Create the data table model.
  const table = useReactTable({
    data: agents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Create the header rows.
  const headerRows = table.getHeaderGroups().map((group) => (
    <TableRow key={group.id}>
      {group.headers.map((header) => (
        <TableHead key={header.id}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </TableHead>
      ))}
    </TableRow>
  ));

  // Create the body rows.
  const bodyRows = table.getRowModel().rows.map((row) => (
    <TableRow key={row.id}>
      {row.getAllCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  ));

  // Insert a placeholder row when there are no agents.
  if (bodyRows.length === 0) {
    bodyRows.push(
      <TableRow key="no_agents_found">
        <TableCell
          colSpan={columns.length}
          className="text-center text-muted-foreground"
        >
          No agents found.
        </TableCell>
      </TableRow>,
    );
  }

  // Return the rendered component.
  return (
    <div className="p-4 overflow-y-auto">
      <div className="rounded-sm border border-border">
        <Table>
          <TableHeader>{headerRows}</TableHeader>
          <TableBody>{bodyRows}</TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * The namespace for the `AgentsTable` statics.
 */
export namespace AgentsTable {
  /**
   * A type alias for the `AgentsTable` props.
   */
  export type Props = {
    /**
     * A callback invoked when the user asks to delete an agent.
     */
    readonly onDelete: (agent: api.AgentConfig) => void;
  };
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The options for creating the table columns.
   */
  export type ColumnOptions = {
    readonly canWrite: boolean;
    readonly canDelete: boolean;
    readonly onDelete: (agent: api.AgentConfig) => void;
  };

  /**
   * Create the helper for defining the columns.
   */
  const columnHelper = createColumnHelper<api.AgentConfig>();

  /**
   * Resolve an agent's display name.
   */
  const displayName = (agent: api.AgentConfig): string =>
    agent.capabilities.identity?.name ?? agent.id;

  /**
   * Create the column definitions for the table.
   */
  export function makeColumns(options: ColumnOptions) {
    const { canWrite, canDelete, onDelete } = options;

    const nameColumn = columnHelper.display({
      id: 'name',
      header: 'Name',
      cell: (cellContext) => {
        const agent = cellContext.row.original;
        return (
          <Link
            className="font-medium hover:text-bd-brand-default"
            to="/chat"
            search={{ agentId: agent.id }}
          >
            {displayName(agent)}
          </Link>
        );
      },
    });

    const idColumn = columnHelper.accessor('id', {
      header: 'Id',
      cell: (cellContext) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
          {cellContext.getValue()}
        </span>
      ),
    });

    const kindColumn = columnHelper.display({
      id: 'kind',
      header: 'Kind',
      cell: (cellContext) => (
        <AgentKindBadge agent={cellContext.row.original} />
      ),
    });

    const modelColumn = columnHelper.display({
      id: 'model',
      header: 'Model',
      cell: (cellContext) => {
        const dynamic = api.getDynamicAgent(cellContext.row.original);
        return (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {dynamic ? dynamic.definition.model : '—'}
          </span>
        );
      },
    });

    const capabilitiesColumn = columnHelper.display({
      id: 'capabilities',
      header: 'Capabilities',
      cell: (cellContext) => {
        const dynamic = api.getDynamicAgent(cellContext.row.original);
        if (!dynamic) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        const { tools, databases, mcpServers } = dynamic.definition;
        const parts: string[] = [];
        const toolCount = tools.length + databases.length;
        if (toolCount > 0) {
          parts.push(`${toolCount} ${toolCount === 1 ? 'tool' : 'tools'}`);
        }
        if (mcpServers.length > 0) {
          parts.push(`${mcpServers.length} MCP`);
        }
        return (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {parts.length > 0 ? parts.join(', ') : '—'}
          </span>
        );
      },
    });

    const toolsColumn = columnHelper.display({
      id: 'tools',
      header: 'Tools',
      cell: (cellContext) => {
        const items = cellContext.row.original.capabilities.tools?.items;
        return (
          <span className="text-xs text-muted-foreground">
            {items?.length ?? 0}
          </span>
        );
      },
    });

    const statusColumn = columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: (cellContext) => <StatusCell agent={cellContext.row.original} />,
    });

    const actionsColumn = columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (cellContext) => {
        const agent = cellContext.row.original;
        if (!api.getDynamicAgent(agent)) {
          return null;
        }
        const name = displayName(agent);
        return (
          <div className="flex flex-row justify-end gap-1">
            {canWrite ? (
              <Button variant="ghost" size="icon-sm" asChild>
                <Link
                  to="/agents"
                  search={{ edit: agent.id }}
                  aria-label={`Edit ${name}`}
                >
                  <Pencil />
                </Link>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${name}`}
                onClick={() => onDelete(agent)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        );
      },
    });

    return [
      nameColumn,
      idColumn,
      kindColumn,
      modelColumn,
      capabilitiesColumn,
      toolsColumn,
      statusColumn,
      actionsColumn,
    ];
  }

  /**
   * A type alias for the `StatusCell` props.
   */
  type StatusCellProps = {
    readonly agent: api.AgentConfig;
  };

  /**
   * A React component that renders an agent's registration status.
   *
   * Only dynamic agents have a status: the backend records a `setupError`
   * when it could not discover the agent's tools (e.g. an unreachable MCP
   * server) but still registered the agent.
   */
  function StatusCell(props: StatusCellProps): ReactNode {
    const dynamic = api.getDynamicAgent(props.agent);
    if (!dynamic) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    if (!dynamic.setupError) {
      return <Badge variant="outline">Ready</Badge>;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" tabIndex={0}>
            Setup failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-words">
          {dynamic.setupError}
        </TooltipContent>
      </Tooltip>
    );
  }
}
