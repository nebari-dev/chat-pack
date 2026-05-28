/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import type {
  Table as TSTable
} from '@tanstack/react-table';

import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable
} from '@tanstack/react-table';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  Button
} from '@/components/ui/button';

import {
  Checkbox
} from '@/components/ui/checkbox';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import {
  useHistoryConfig
} from '@/context';

import {
  cn
} from '@/lib/utils';


/**
 * A React component that renders the threads table.
 */
export
function ThreadsTable(): ReactNode {
  // Fetch the thread page.
  const { page } = useHistoryConfig();

  // Create the data table model.
  const table = useReactTable({
    data: page.items as api.Thread[],
    columns: Private.columns,
    getCoreRowModel: getCoreRowModel()
  });

  // Create the array to hold the header rows.
  const headerRows: ReactNode[] = [];

  // Create the column -> className mapping.
  const classNames = {
    name: 'w-[60%]'
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

  // Insert a placeholder row when there are no threads.
  if (bodyRows.length === 0) {
    bodyRows.push(
      <TableRow key={ `no_threads_found` }>
        <TableCell
          colSpan={ table.getAllColumns().length }
          className='text-center text-muted-foreground'>
          No threads found.
        </TableCell>
      </TableRow>
    );
  }

  // Return the rendered component.
  return (
    <div className='p-4 overflow-y-auto'>
      <div className='rounded-sm border border-border'>
        <Table>
          <TableHeader>
            { headerRows }
          </TableHeader>
          <TableBody>
            { bodyRows }
          </TableBody>
        </Table>
        <Private.ClearDeleteBar table={ table } />
      </div>
    </div>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the helper for defining the columns.
   */
  const columnHelper = createColumnHelper<api.Thread>();

  /**
   * Create the column for the selection check boxes.
   */
  const selectColumn = columnHelper.display({
    id: 'select',
    header: headerContext => {
      const table = headerContext.table;
      const all = table.getIsAllRowsSelected();
      const some = table.getIsSomeRowsSelected();
      const handleChange = () => table.toggleAllRowsSelected();
      const checked = all ? true : some ? 'indeterminate' : false;
      return (
        <Checkbox
          aria-label='Select All'
          className={ cn(
            'data-[state=checked]:bg-bd-brand-default',
            'data-[state=checked]:border-none') }
          checked={ checked }
          onCheckedChange={ handleChange } />
      );
    },
    cell: cellContext => {
      const row = cellContext.row;
      const checked = row.getIsSelected();
      const handleChange = () => row.toggleSelected();
      return (
        <Checkbox
          aria-label='Select Row'
          className={ cn(
            'data-[state=checked]:bg-bd-brand-default',
            'data-[state=checked]:border-none') }
          checked={ checked }
          onCheckedChange={ handleChange }/>
      );
    },
  });

  /**
   * Create the column to display the memory text data.
   */
  const nameColumn = columnHelper.accessor('name', {
    header: 'Name',
    cell: cellContext => {
      const row = cellContext.row;
      const threadId = row.original.id;
      const activeProps = {
        className: 'text-bd-brand-default font-semibold'
      };
      return (
        <p className='whitespace-pre-wrap'>
          <Link
            className='block'
            to='/chat'
            search={ { threadId } }
            activeProps={ activeProps }>
            { cellContext.getValue() || 'Untitled Thread' }
          </Link>
        </p>
      );
    },
  });

  /**
   * Create the column to display the agent Id.
   */
  const agentIdColumn = columnHelper.accessor('agentId', {
    header: 'Agent Id',
    cell: cellContext => {
      return (
        <span className='whitespace-nowrap text-xs text-muted-foreground'>
          { cellContext.getValue() }
        </span>
      );
    }
  });

  /**
   * Create the column to display the created timestamp.
   */
  const createdAtColumn = columnHelper.accessor('createdAt', {
    header: 'Created At',
    cell: cellContext => {
      const ts = cellContext.getValue();
      const dateStr = (new Date(ts)).toLocaleString();
      return (
        <span className='whitespace-nowrap text-xs text-muted-foreground'>
          { dateStr }
        </span>
      );
    }
  });

  /**
   * The column definitions for the table.
   */
  export
  const columns = [
    selectColumn,
    nameColumn,
    agentIdColumn,
    createdAtColumn
  ];

  /**
   * A type alias for the `ClearDeleteBar` props.
   */
  export
  type ClearDeleteBarProps = {
    /**
     * The Tanstack table instance for the page.
     */
    readonly table: TSTable<api.Thread>;
  };

  /**
   * A React component that renders the clear/delete bar for the page.
   */
  export
  function ClearDeleteBar(props: ClearDeleteBarProps): ReactNode {
    // Extract the props.
    const { table } = props;

    // Fetch the delete threads handler.
    const { deleteThreads } = useHistoryConfig();

    // Fetch the needed info from the table.
    const rowCount = table.getRowModel().rows.length;
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;

    // Don't render the bar if there are no selected rows.
    if (selectedRowCount === 0) {
      return null;
    }

    // Create the callback to handle clearing the selection.
    const handleClear = () => {
      table.resetRowSelection();
    };

    // Create the callback to handle deleting the selection.
    const handleDelete = () => {
      // Fetch the ids of the threads to delete.
      const rows = table.getSelectedRowModel().rows;
      const ids = rows.map(row => row.original.id);

      // Clear the selected rows.
      table.resetRowSelection();

      // Delete the threads on the server.
      deleteThreads(ids);
    };

    // Return the rendered component.
    return (
      <div className={ cn(
        'fixed bottom-4 flex flex-row justify-self-center items-center gap-4',
        'rounded-sm border px-4 py-2 shadow-lg z-1 bg-bg-white') }>
        <div>
          <span className='font-medium text-foreground'>
            { selectedRowCount }
          </span>
          <span className='text-muted-foreground'>
            { ` of ${rowCount} items selected` }
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            className='rounded-sm cursor-pointer'
            variant='ghost'
            size='sm'
            onClick={ handleClear }>
            Clear Selection
          </Button>
          <Button
            className='rounded-sm cursor-pointer'
            variant='destructive'
            size='sm'
            onClick={ handleDelete }>
            Delete Selection
          </Button>
        </div>
      </div>
    );
  }
}
