/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';


/**
 * A react component that renders the user input for a run.
 */
export
function RunInput(props: RunInput.Props): ReactNode {
  // Extract the props.
  const { prompt } = props;

  // Return the rendered component.
  return (
    <div className='flex flex-row justify-end'>
      <div className='px-4 py-2 rounded-md bg-bg-neutral-dark'>
        { prompt }
      </div>
    </div>
  );
}


/**
 * The namespace for the `RunInput` statics.
 */
export
namespace RunInput {
  /**
   * A type alias for the `RunInput` props.
   */
  export
  type Props = {
    /**
     * The user prompt for the session run.
     */
    readonly prompt: string;
  };
}


/**
 * A memoized version of `RunInput`.
 */
export
const RunInputMemo = memo(RunInput);
