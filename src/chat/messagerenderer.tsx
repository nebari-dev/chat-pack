/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  Message
} from '@ag-ui/core';

import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import {
  AssistantMessage
} from './assistantmessage';

import {
  UserMessage
} from './usermessage';


/**
 * A react component that renders an ag-ui message.
 */
export
function MessageRenderer(props: MessageRenderer.Props): ReactNode {
  // Extract the message.
  const { msg } = props;

  // Create the variable to hold the generated content.
  let content: ReactNode;

  // Dipspatch on the message role.
  switch (msg.role) {
  case 'user':
    content = <UserMessage msg={ msg } />;
    break;
  case 'assistant':
    content = <AssistantMessage msg={ msg } />;
    break;
  case 'tool':
    // Ignore tool messages, as they will be caught by the `ToolCallsRenderer`.
    content = null;
    break;
  default:
    // ignore other messages for now
    console.log(`Ingoring rendering for msg role: '${msg.role}'`);
    content = null;
    break;
  }

  // Return the content.
  return content;
}


/**
 * The namespace for the `MessageRenderer` statics.
 */
export
namespace MessageRenderer {
  /**
   * A type alias for the `MessageRenderer` props.
   */
  export
  type Props = {
    /**
     * The message to be rendered.
     */
    readonly msg: Message;
  };
}


/**
 * A memoized version of `MessageRenderer`.
 */
export
const MessageRendererMemo = memo(MessageRenderer);
