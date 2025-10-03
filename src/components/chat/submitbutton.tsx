/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Send
} from 'lucide-react';

import type {
  MouseEvent, ReactNode
} from 'react';


/**
 * A React component which renders the chat submit button.
 */
export
function SubmitButton(props: SubmitButton.Props): ReactNode {
  // Extract the props.
  const { onClick } = props;

  // Return the rendered component.
  return (
    <button onClick={ onClick } className={ clsx(
      'flex-none px-3 h-8 flex flex-row gap-2 items-center justify-center',
      'whitespace-nowrap cursor-pointer bg-bg-brand-default',
      'text-text-brand-on-brand border border-bd-brand-default rounded-xs'
    ) }>
      Send
      <Send size={ 16 } />
    </button>
  );
}


/**
 * The namespace for the `SubmitButton` component statics.
 */
export
namespace SubmitButton {
  /**
   * A type alias for the `SubmitButton` props.
   */
  export
  type Props = {
    /**
     * The click handler for the button.
     */
    onClick: (event: MouseEvent) => void;
  };
}
