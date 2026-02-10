/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
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
  useMemories
} from '@/context';

import {
  cn
} from '@/lib/utils';


/**
 * A React component that renders the table of agentic user memories.
 */
export
function DataTable(): ReactNode {
  // Fetch the memories page.
  const { page } = useMemories();

  // Create the data table model.
  const table = useReactTable({
    data: page.items as api.Memory[],  // dumb cast required for tanstack
    columns: Private.columns,
    getCoreRowModel: getCoreRowModel()
  });

  // Create the array to hold the header rows.
  const headerRows: ReactNode[] = [];

  // Create the column -> className mapping.
  const classNames = {
    memory: 'w-[60%]',
    topics: 'w-[40%]'
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
      <TableRow key='$no_memories_found'>
        <TableCell
          colSpan={ table.getAllColumns().length }
          className='text-center text-muted-foreground'>
          No memories found.
        </TableCell>
      </TableRow>
    );
  }

  // Return the rendered component.
  return (
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
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the helper for defining the columns.
   */
  const columnHelper = createColumnHelper<api.Memory>();

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
  const memoryColumn = columnHelper.accessor('content', {
    header: 'Memory',
    cell: cellContext => {
      return (
        <p className='max-w-xl whitespace-pre-wrap break-words'>
          { cellContext.getValue() }
        </p>
      );
    },
  });

  /**
   * Create the column to display the memory topics.
   */
  const topicsColumn = columnHelper.accessor('topics', {
    header: 'Topics',
    cell: cellContext => {
      const topics = cellContext.getValue();
      const spans = topics.map(topic => (
        <span
          key={ topic }
          className='rounded-full bg-muted px-2 py-0.5 text-[11px]'>
          { topic }
        </span>
      ));
      return <div className='flex flex-wrap gap-1'>{ spans }</div>;
    },
  });

  /**
   * Create the column to display the updated timestamp.
   */
  const updatedAtColumn = columnHelper.accessor('updatedAt', {
    header: 'Updated At',
    cell: cellContext => {
      const date = new Date(cellContext.getValue());
      return (
        <span className='whitespace-nowrap text-xs text-muted-foreground'>
          { date.toLocaleString() }
        </span>
      );
    },
  });

  /**
   * The column definitions for the table.
   */
  export
  const columns = [
    selectColumn,
    memoryColumn,
    topicsColumn,
    updatedAtColumn
  ];

  /**
   * A type alias for the `ClearDeleteBar` props.
   */
  export
  type ClearDeleteBarProps = {
    /**
     * The Tanstack table instance for the page.
     */
    readonly table: TSTable<api.Memory>;
  };

  /**
   * A React component that renders the clear/delete bar for the page.
   */
  export
  function ClearDeleteBar(props: ClearDeleteBarProps): ReactNode {
    // Extract the props.
    const { table } = props;

    // Fetch the memories config.
    const { deleteMemories } = useMemories();

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
      // Fetch the ids of the memories to delete.
      const rows = table.getSelectedRowModel().rows;
      const ids = rows.map(row => row.original.memoryId);

      // Clear the selected rows.
      table.resetRowSelection();

      // Delete the memories on the server.
      deleteMemories(ids);
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
