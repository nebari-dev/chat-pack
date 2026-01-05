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

  // TODO support workflow sessions.
  if (detail.type === 'workflow') {
    return null;
  }

  // Determine the label for the detail type.
  const label = detail.type === 'agent' ? 'Agent' : 'Team';

  // Fetch the data for the detail type.
  const data = detail.type === 'agent' ? detail.agent_data : detail.team_data;

  // Convert the UTC date strings to date objects.
  const createdAt = new Date(detail.created_at);
  const updatedAt = new Date(detail.updated_at);

  // Return the rendered component.
  return (
    <div className='p-4'>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className='w-[30%]'>
              { label }
            </TableCell>
            <TableCell className='w-[70%] font-semibold'>
              { data.name }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model
            </TableCell>
            <TableCell className='font-semibold'>
              { data.model.name }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model Id
            </TableCell>
            <TableCell className='font-semibold'>
              { data.model.id }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Model Provider
            </TableCell>
            <TableCell className='font-semibold'>
              { data.model.provider }
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
