/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import type {
  ReactNode
} from 'react';


/**
 * A react component that renders an ag-ui `UserMessage`.
 */
export
function UserMessage(props: UserMessage.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Collect the text from the user message.
  const text = Private.collectText(message);

  // Return the rendered component.
  return (
    <div className='flex flex-row justify-end'>
      <div className='px-4 py-2 rounded-md bg-bg-neutral-dark'>
        { text }
      </div>
    </div>
  );
}


/**
 * The namespace for the `UserMessage` statics.
 */
export
namespace UserMessage {
  /**
   * A type alias for the `UserMessage` props.
   */
  export
  type Props = {
    /**
     * The ag-ui user message.
     */
    readonly message: agui.UserMessage;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Collect the complete text from an ag-ui user message.
   */
  export
  function collectText(message: agui.UserMessage): string {
    // Quick exit if the content is a string.
    if (typeof message.content === 'string') {
      return message.content;
    }

    // Otherwise, filter the message for text parts.
    //
    // TODO - handle binary content attachments.
    const text = message.content.reduce((acc, part) => {
      return part.type === 'text' ? acc + part.text : acc;
    }, '');

    // Return the collected text.
    return text;
  }
}
