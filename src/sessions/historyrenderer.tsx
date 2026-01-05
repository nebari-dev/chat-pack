/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';


/**
 * A react component that renders the session history in the detail panel.
 */
export
function HistoryRenderer(props: HistoryRenderer.Props): ReactNode {
  // Return the rendered component.
  return (
    <div className='p-4'>
      History
    </div>
  );
}


/**
 * The namespace for the `HistoryRenderer` statics.
 */
export
namespace HistoryRenderer {
  /**
   * A type alias for the `HistoryRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}
