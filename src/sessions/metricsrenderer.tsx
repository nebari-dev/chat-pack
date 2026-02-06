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
 * A react component that renders the session metrics in the detail panel.
 */
export
function MetricsRenderer(props: MetricsRenderer.Props): ReactNode {
  // Extract the props.
  const { detail } = props;

  // Get the metrics from the detail.
  const { tokenMetrics } = detail;

  // Return the rendered component.
  return (
    <div className='p-4'>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className='w-[30%]'>
              Input Tokens
            </TableCell>
            <TableCell className='w-[70%] font-semibold'>
              { tokenMetrics.inputTokens }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Output Tokens
            </TableCell>
            <TableCell className='font-semibold'>
              { tokenMetrics.outputTokens }
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Total Tokens
            </TableCell>
            <TableCell className='font-semibold'>
              { tokenMetrics.totalTokens }
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}


/**
 * The namespace for the `MetricsRenderer` statics.
 */
export
namespace MetricsRenderer {
  /**
   * A type alias for the `MetricsRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}
