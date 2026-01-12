/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';


/**
 * A react component that renders a simple key-value table.
 */
export
function KVTable(props: KVTable.Props): ReactNode {
  // Extract the props.
  const { data, keyLabel, valueLabel } = props;

  // Setup the array to hold the table rows.
  const rows: ReactNode[] = [];

  // Map over the data and create the rows.
  for (const [key, value] of Object.entries(data)) {
    rows.push(
      <TableRow key={ key }>
        <TableCell>
          { key }
        </TableCell>
        <TableCell>
          { JSON.stringify(value) }
        </TableCell>
      </TableRow>
    );
  }

  // Return the rendered component.
  return (
    <Table className='w-full'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[20%]'>
            { keyLabel ?? 'Key' }
          </TableHead>
          <TableHead className='w-[80%]'>
            { valueLabel ?? 'Value' }
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        { rows }
      </TableBody>
    </Table>
  );
}


/**
 * The namespace for the `KVTable` statics.
 */
export
namespace KVTable {
  /**
   * A type alias for the `KVTable` props.
   */
  export
  type Props = {
    /**
     * The data for the table.
     */
    readonly data: Record<string, unknown>;

    /**
     * The label for the key column.
     *
     * The default is 'Key'.
     */
    readonly keyLabel?: string;

    /**
     * The label for the value column.
     *
     * The default is 'Value'.
     */
    readonly valueLabel?: string;
  };
}
