/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  RunRendererMemo
} from '@/components/chatrun/runrenderer';


/**
 * A react component that renders the session history in the detail panel.
 */
export
function HistoryRenderer(props: HistoryRenderer.Props): ReactNode {
  // Extract the props.
  const { runs } = props;

  // Create the content for the runs.
  const content = runs.map(run =>
    <RunRendererMemo key={ run.run_id } run={ run } />
  );

  // Return the rendered component.
  return (
    <div className='p-4 grow min-h-0 overflow-y-auto'>
      { content }
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
     * The session session runs from the api.
     */
    readonly runs: readonly api.SessionRun[];
  };
}
