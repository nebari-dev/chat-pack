/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useChatRuntime
} from './chatruntimeprovider';

import {
  RunRendererMemo
} from './runrenderer';


/**
 * A react component that renders the chat output for the session.
 */
export
function ChatOutput(): ReactNode {
  // Fetch the chat runtime.
  const { runs } = useChatRuntime();

  // Create the content for the runs.
  const content = runs.map(run =>
    <RunRendererMemo key={ run.run_id } run={ run } />
  );

  // Return the rendered component.
  return (
    <div className='grow mx-auto w-full min-w-3xs max-w-3xl'>
      { content }
    </div>
  );
}
