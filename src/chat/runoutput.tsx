/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  ContentRenderer
} from './contentrenderer';

import {
  ToolsRenderer
} from './toolsrenderer';


/**
 * A react component that renders the agent output for a run.
 */
export
function RunOutput(props: RunOutput.Props): ReactNode {
  // Extract the props.
  const { events } = props;

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <ToolsRenderer events={ events } />
      <ContentRenderer events={ events } />
    </div>
  );
}


/**
 * The namespace for the `RunOutput` statics.
 */
export
namespace RunOutput {
  /**
   * A type alias for the `RunOutput` props.
   */
  export
  type Props = {
    /**
     * The session run for rendering the user input.
     */
    readonly events: readonly api.RunEvent[];
  };
}
