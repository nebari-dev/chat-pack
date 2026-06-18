/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { ReactNode } from 'react';

import { memo } from 'react';
import { ActivityMessage } from './activitymessage';
import { AssistantMessage } from './assistantmessage';

import { ReasoningLink } from './reasoninglink';

import { UserMessage } from './usermessage';

/**
 * A react component that renders an ag-ui message.
 */
export function MessageRenderer(props: MessageRenderer.Props): ReactNode {
  // Extract the message.
  const { message } = props;

  // Create the variable to hold the generated content.
  let content: ReactNode;

  // Dipspatch on the message role.
  switch (message.role) {
    case 'user':
      content = <UserMessage message={message} />;
      break;
    case 'assistant':
      content = <AssistantMessage message={message} />;
      break;
    case 'reasoning':
      content = <ReasoningLink message={message} />;
      break;
    case 'tool':
      // Ignore tool messages. The tool call count is caught by the assistant
      // message renderer, and the tool content is opened in the chat sidebar.
      content = null;
      break;
    case 'activity':
      content = <ActivityMessage message={message} />;
      break;
    default:
      // ignore other messages for now
      console.log(`Ignoring message role: ${message.role}`);
      content = null;
      break;
  }

  // Bail early if there is no content to render.
  if (!content) {
    return null;
  }

  // Return the rendered component.
  return <div className="mt-4">{content}</div>;
}

/**
 * The namespace for the `MessageRenderer` statics.
 */
export namespace MessageRenderer {
  /**
   * A type alias for the `MessageRenderer` props.
   */
  export type Props = {
    /**
     * The ag-ui message to be rendered.
     */
    readonly message: agui.Message;
  };
}

/**
 * A memoized version of `MessageRenderer`.
 */
export const MessageRendererMemo = memo(MessageRenderer);
