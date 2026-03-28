/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import {
  useQuery
} from '@tanstack/react-query';

import {
  JsonEditor
} from 'json-edit-react';

import {
  X
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  Button
} from '@/components/ui/button';

import {
  Separator
} from '@/components/ui/separator';

import {
  useChatConfig
} from '@/context/chat';

import type {
  ToolCallsDetail
} from '@/context/chatsidebar';

import {
  threadMessagesQuery
} from '@/queries';


/**
 * A react component that renders the tools for an assistant message.
 */
export
function SidebarTools(props: SidebarTools.Props): ReactNode {
  // Extract the props.
  const { detail, onClose } = props;

  // Fetch the current thread from the chat config.
  const { thread } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the target thread message from the chat.
  const { data: message } = useQuery({
    ...query,
    select: msgs => (
      (msgs ?? []).find(msg =>
        msg.id === detail.messageId &&
        msg.role === 'assistant' &&
        msg.toolCalls &&
        msg.toolCalls.length > 0
    ))
  });

  // Bail early if a valid message is not found.
  if (!message) {
    return null;
  }

  // Cast the message to the known type with tool calls > 0.
  //
  // See the query `select` clause above.
  const msg = message as agui.AssistantMessage;

  // Create the content for the tool calls.
  const content = msg.toolCalls!.map(tc =>
    <Private.ToolCallItem key={ tc.id } toolCall={ tc } />
  );

  // Return the rendered component.
  return (
    <section>
      <h1 className='p-2 flex flex-row justify-between items-center'>
        <span className='text-xl font-bold'>
          Tool Calls
        </span>
        <Button
          className='hover:cursor-pointer'
          variant='ghost'
          onClick={ onClose }>
          <X />
        </Button>
      </h1>
      <Separator />
      { content }
    </section>
  );
}


/**
 * The namespace for the `SidebarTools` statics.
 */
export
namespace SidebarTools {
  /**
   * A type alias for the `SidebarTools` props.
   */
  export
  type Props = {
    /**
     * The tool calls detail for the component.
     */
    readonly detail: ToolCallsDetail;

    /**
     * A callback to close the sidebar.
     */
    readonly onClose: () => void;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the item for a tool call.
   */
  export
  function ToolCallItem(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Return the rendered component.
    return (
      <div className='px-2 flex flex-col gap-4'>
        <div className='font-semibold'>
          { toolCall.function.name.toUpperCase() }
        </div>
        <ToolCallArgs toolCall={ toolCall } />
        <ToolCallResult toolCall={ toolCall } />
      </div>
    );
  }

  /**
   * The namespace for the `ToolCallItem` statics.
   */
  export
  namespace ToolCallItem {
    /**
     * A type alias for the `ToolCallItem` props.
     */
    export
    type Props = {
      /**
       * The ag-ui tool call to render.
       */
      readonly toolCall: agui.ToolCall;
    };
  }

  /**
   * A react component that renders the arguments for a tool call.
   */
  function ToolCallArgs(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Try to parse the arguments to JSON, falling back on the string.
    const args = (() => {
      try {
        return JSON.parse(toolCall.function.arguments);
      } catch {
        return toolCall.function.arguments;
      }
    })();

    // Return the rendered component.
    return (
      <JsonEditor
        className='ot-ChatPlusPlus-jer'
        data={ args }
        maxWidth='100%'
        rootName='arguments'
        viewOnly={ true }
        rootFontSize={ 12 }
        collapse={ false } />
    );
  }

  /**
   * A react component that renders the result for a tool call.
   */
  function ToolCallResult(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Find the tool message that matches the tool call id.
    const toolMessage = useToolMessage(toolCall.id);

    // Try to parse the result to JSON, falling back on the string.
    const result = (() => {
      try {
        return JSON.parse(toolMessage?.content ?? '');
      } catch {
        return toolMessage?.content ?? '';
      }
    })();

    // Return the rendered component.
    return (
      <JsonEditor
        className='ot-ChatPlusPlus-jer'
        data={ result }
        maxWidth='100%'
        rootName='result'
        viewOnly={ true }
        rootFontSize={ 12 }
        collapse={ true } />
    );
  }

  /**
   * A hook which finds the `ToolMessage` result for a `toolCallId`.
   */
  function useToolMessage(toolCallId: string): agui.ToolMessage | undefined {
    // Fetch the thread from the chat config.
    const { thread } = useChatConfig();

    // Create the query for the thread.
    const query = threadMessagesQuery(thread?.id);

    // Find the tool message that finishes the tool call.
    const { data: message } = useQuery({
      ...query,
      select: msgs => {
        return (msgs ?? []).find(msg =>
          msg.role === 'tool' &&
          msg.toolCallId === toolCallId
        );
      }
    });

    // Return the found tool messages, or `undefined`.
    return message as (agui.ToolMessage | undefined);
  }
}
