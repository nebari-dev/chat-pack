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
  ActivityMessage
} from './activitymessage';

import {
  ReasoningButton
} from './reasoningbutton';

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
  case 'reasoning':
    content = <ReasoningButton messageId={ msg.id } />;
    break;
  case 'tool':
    // Ignore tool messages. The tool call count is caught by the assistant
    // message renderer, and the content is opened in the chat sidebar.
    content = null;
    break;
  case 'activity':
    content = <ActivityMessage msg={ msg } />;
    break;
  default:
    // ignore other messages for now
    console.log(`Ignoring message role: ${msg.role}`);
    content = null;
    break;
  }

  // Bail early if there is no content to render.
  if (!content) {
    return null;
  }

  // Return the rendered component.
  return (
    <div className='mt-4'>
      { content}
    </div>
  );
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
