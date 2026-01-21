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


/**
 * A react component that renders the assistant output for a run.
 */
export
function RunOutput(props: RunOutput.Props): ReactNode {
  // Extract the props.
  const { run } = props;

  // Return the rendered component.
  return (
    <div>
      { run.content }
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
    readonly run: api.SessionRun;
  };
}


/**
 * A memoized version of `RunOutput`.
 */
export
const RunOutputMemo = memo(RunOutput);
