/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  Table, TableBody, TableCell, TableRow
} from '@/components/ui/table';


/**
 * A react component that renders the session details in the detail panel.
 */
export
function DetailsRenderer(props: DetailsRenderer.Props): ReactNode {
  // Extract the props.
  const { detail } = props;

  // Convert the UTC date strings to date objects.
  const createdAt = new Date(detail.createdAt);
  const updatedAt = new Date(detail.updatedAt);

  // Return the rendered component.
  return (
    <div className='p-4'>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className='w-[30%]'>
              Agent
            </TableCell>
            <TableCell className='w-[70%] font-semibold'>
              TODO: Get Agent Name
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model
            </TableCell>
            <TableCell className='font-semibold'>
              TODO: Get Model Name
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model Id
            </TableCell>
            <TableCell className='font-semibold'>
              TODO: Get Model Name
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model Provider
            </TableCell>
            <TableCell className='font-semibold'>
              TODO: Get Model Provider
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Created At
            </TableCell>
            <TableCell className='font-semibold'>
              { createdAt.toLocaleString() }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Last Updated
            </TableCell>
            <TableCell className='font-semibold'>
              { updatedAt.toLocaleString() }
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}


/**
 * The namespace for the `DetailsRenderer` statics.
 */
export
namespace DetailsRenderer {
  /**
   * A type alias for the `DetailsRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}
