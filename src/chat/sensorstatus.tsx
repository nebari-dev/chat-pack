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
 * A react component that renders the sensor status card.
 */
export
function SensorStatus(props: SensorStatus.Props): ReactNode {
  // Extract the props.
  const { className } = props;

  // Return the rendered component.
  return (
    <Card className={ cn(
      'min-w-0 min-h-40 gap-2 py-4 rounded-sm', className) }>
      <CardHeader className='px-4'>
        <CardTitle>
          Sensor Status
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 grow min-h-0'>
        <Private.DataTable />
      </CardContent>
    </Card>
  );
}


/**
 * The namespace for the `SensorStatus` statics.
 */
export
namespace SensorStatus {
  /**
   * A type alias for the `SensorStatus` props.
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
   * A type alias for the state of a sensor.
   *
   * Assumed to be valid from the sensor.
   *
   * No client validation for the demo.
   */
  type SensorState = {
    readonly sensor_id: string;
    readonly status: string;
    readonly latency_ms: number;
    readonly packet_loss: number;
    readonly clock_skew_ms: number;
    readonly last_ts: string;
  };

  /**
   * Create the helper for defining the columns.
   */
  const columnHelper = createColumnHelper<SensorState>();

  /**
   * Create the column to display the sensor id
   */
  const sensorIdColumn = columnHelper.accessor('sensor_id', {
    header: 'Sensor ID',
    cell: cellContext => cellContext.getValue(),
  });

  /**
   * Create the column to display the sensor status
   */
  const statusColumn = columnHelper.accessor('status', {
    header: 'Status',
    cell: cellContext => {
      const status = cellContext.getValue();
      const className = (
        status === 'ok' ?
        'text-green-600' :
        status === 'degraded' ?
        'text-orange-500' :
        status === 'down' ?
        'text-red-500' :
        ''
      )
      return (
        <span className={ className }>
          { cellContext.getValue() }
        </span>
      );
    },
  });

  /**
   * Create the column to display the latency.
   */
  const latencyColumn = columnHelper.accessor('latency_ms', {
    header: 'Latency',
    cell: cellContext => cellContext.getValue(),
  });

  /**
   * Create the column to display the packet loss.
   */
  const packetLossColumn = columnHelper.accessor('packet_loss', {
    header: 'Packet Loss',
    cell: cellContext => cellContext.getValue(),
  });

  /**
   * Create the column to display the clock skew.
   */
  const clockSkewColumn = columnHelper.accessor('clock_skew_ms', {
    header: 'Clock Skew',
    cell: cellContext => cellContext.getValue(),
  });

  /**
   * Create the column to display the last timestamp
   */
  const lastUpdatedColumn = columnHelper.accessor('last_ts', {
    header: 'Last Updated',
    cell: cellContext => {
      const date = new Date(cellContext.getValue());
      return date.toLocaleString();
    },
  });

  /**
   * The column definitions for the table.
   */
  const columns = [
    sensorIdColumn,
    statusColumn,
    latencyColumn,
    packetLossColumn,
    clockSkewColumn,
    lastUpdatedColumn
  ];

  /**
   * A React component that sensor status table.
   */
  export
  function DataTable(): ReactNode {
    // Set up the data polling loop.
    const data = usePoll<SensorState[]>(2000, '/api/api/state/sensors') ?? [];

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
      sensor_id: 'w-25',
      status: 'w-20',
      latency_ms: 'w-20',
      packet_loss: 'w-25',
      clock_skew_ms: 'w-25',
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
      <div className='rounded-sm border border-border'>
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
