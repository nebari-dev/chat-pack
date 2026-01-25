/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable
} from '@tanstack/react-table';

import {
  type ReactNode
} from 'react';

import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import {
  cn
} from '@/lib/utils';

import {
  usePoll
} from './usepoll';


/**
 * A react component that renders the alerts feed.
 */
export
function Alerts(props: Alerts.Props): ReactNode {
  // Extract the props.
  const { className } = props;

  // Return the rendered component.
  return (
    <Card className={ cn(
      'min-w-0 min-h-40 gap-2 py-4 rounded-sm', className) }>
      <CardHeader className='px-4'>
        <CardTitle>
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 grow min-h-0 flex flex-col'>
        <Private.DataTable />
      </CardContent>
    </Card>
  );
}


/**
 * The namespace for the `Alerts` statics.
 */
export
namespace Alerts {
  /**
   * A type alias for the `Alerts` props.
   */
  export
  type Props = {
    /**
     * The class name for the component.
     */
    readonly className?: string;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for an alert state.
   *
   * Assumed to be valid from the server.
   *
   * No client validation for the demo.
   */
  type AlertState = {
    readonly alert_id: string;
    readonly severity: string;
    readonly alert_type: string;
    readonly status: string;
    readonly linked_track_ids: string[];
    readonly reason_short: string;
    readonly last_ts: string;
  };

  /**
   * Create the helper for defining the columns.
   */
  const columnHelper = createColumnHelper<AlertState>();

  /**
   * Create the column to display the alert type.
   */
  const statusColumn = columnHelper.accessor('status', {
    header: 'Status',
    cell: cellContext => {
      const label = cellContext.getValue().toUpperCase();
      const className = (
        label === 'ACTIVE' ?
        'text-red-600' :
        label === 'CLEARED' ?
        'text-green-600':
        ''
      );
      return (
        <span className={ className }>
          { cellContext.getValue().toUpperCase() }
        </span>
      );
    },
  });

  /**
   * Create the column to display the alert timestamp.
   */
  const timestampColumn = columnHelper.accessor('last_ts', {
    header: 'Time',
    cell: cellContext => {
      const date = new Date(cellContext.getValue());
      return date.toLocaleTimeString();
    },
  });

  /**
   * The column definitions for the table.
   */
  const columns = [
    statusColumn,
    timestampColumn,
  ];

  /**
   * A react component that renders the alerts table.
   */
  export
  function DataTable(): ReactNode {
    // Set up the data polling loop.
    const data = usePoll<AlertState[]>(2000, '/api/api/state/alerts') ?? [];

    // Create the data table model.
    const table = useReactTable({
      data: data,
      columns: columns,
      getCoreRowModel: getCoreRowModel()
    });

    // Create the array to hold the header rows.
    const headerRows: ReactNode[] = [];

    // Create the column -> className mapping.
    const classNames = {
      status: 'w-[60%]',
      last_ts: ''
    } as Record<string, string>;

    // Iterate the header groups to create the header rows.
    for (const group of table.getHeaderGroups()) {
      // Create the array to hold the cells for the group.
      const cells: ReactNode[] = [];

      // Iterate the header to create the cells.
      for (const header of group.headers) {
        // Format the content for the header cell.
        const template = header.column.columnDef.header;
        const content = flexRender(template, header.getContext());

        // Create and add the header cell.
        cells.push(
          <TableHead
            key={ header.id }
            className={ classNames[header.id] }>
            { content }
          </TableHead>
        );
      }

      // Create and add the header row.
      headerRows.push(<TableRow key={ group.id }>{ cells }</TableRow>);
    }

    // Create the array to hold the body rows.
    const bodyRows: ReactNode[] = [];

    // Iterate the model to create the body rows.
    for (const row of table.getRowModel().rows) {
      // Create the array to hold the cells for the row.
      const cells: ReactNode[] = [];

      // Iterate the row to create the cells.
      for (const cell of row.getAllCells()) {
        // Format the content for the body cell.
        const template = cell.column.columnDef.cell;
        const content = flexRender(template, cell.getContext());

        // Create and add the body cell.
        cells.push(<TableCell key={ cell.id }>{ content }</TableCell>);
      }

      // Create and add the body row.
      bodyRows.push(<TableRow key={ row.id }>{ cells }</TableRow>);
    }

    // Insert a placeholder row when there are no memories.
    if (bodyRows.length === 0) {
      bodyRows.push(
        <TableRow key='$no_data_available'>
          <TableCell
            colSpan={ table.getAllColumns().length }
            className='text-center text-muted-foreground'>
            No data available
          </TableCell>
        </TableRow>
      );
    }

    // Return the rendered component.
    return (
      <div className='rounded-sm border border-border grow overflow-y-auto'>
        <Table className='table-fixed'>
          <TableHeader>
            { headerRows }
          </TableHeader>
          <TableBody>
            { bodyRows }
          </TableBody>
        </Table>
      </div>
    );
  }
}
