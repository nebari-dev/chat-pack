/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import * as api from '@/api';

import {
  RunInputMemo
} from './runinput';

import {
  RunOutputMemo
} from './runoutput';


/**
 * A react component that renders a run in the chat.
 */
export
function RunRenderer(props: RunRenderer.Props): ReactNode {
  // Extract the props.
  const { run } = props;

  // Return the rendered component.
  return (
    <div className='mt-6 flex flex-col gap-6'>
      <RunInputMemo prompt={ run.run_input } />
      <RunOutputMemo run={ run } />
    </div>
  );
}


/**
 * The namespace for the `RunRenderer` statics.
 */
export
namespace RunRenderer {
  /**
   * A type alias for the `RunRenderer` props.
   */
  export
  type Props = {
    /**
     * The run to be rendered.
     */
    readonly run: api.SessionRun;
  };
}


/**
 * A memoized version of `RunRenderer`.
 */
export
const RunRendererMemo = memo(RunRenderer);
