/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import type * as agui from '@ag-ui/core';
import { contentToText } from '@ag-ui/core';

import { useQuery } from '@tanstack/react-query';

import type { ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockCopyButton,
  CodeBlockHeader,
} from '@/components/ui/code-block';

import { useChatConfig } from '@/context/chat';

import { threadMessagesQuery } from '@/queries';

/**
 * A react component that renders the sidebar tool content.
 */
export function SidebarTools(props: SidebarTools.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Create the content for the tool calls.
  const content = (message.toolCalls ?? []).map((tc) => (
    <Private.ToolCallItem key={tc.id} toolCall={tc} />
  ));

  // Return the rendered component.
  return <div>{content}</div>;
}

/**
 * The namespace for the `SidebarTools` statics.
 */
export namespace SidebarTools {
  /**
   * A type alias for the `SidebarTools` props.
   */
  export type Props = {
    /**
     * The assistant message the holds the tools.
     */
    readonly message: agui.AssistantMessage;
  };
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the item for a tool call.
   */
  export function ToolCallItem(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Return the rendered component.
    return (
      <div className="px-2 py-4 flex flex-col gap-4">
        <div className="font-semibold">
          {toolCall.function.name.toUpperCase()}
        </div>
        <ToolCallArgs toolCall={toolCall} />
        <ToolCallResult toolCall={toolCall} />
      </div>
    );
  }

  /**
   * The namespace for the `ToolCallItem` statics.
   */
  export namespace ToolCallItem {
    /**
     * A type alias for the `ToolCallItem` props.
     */
    export type Props = {
      /**
       * The ag-ui tool call to render.
       */
      readonly toolCall: agui.ToolCall;
    };
  }

  /**
   * The most payload lines shown before a code block scrolls.
   */
  const MAX_PAYLOAD_LINES = 16;

  /**
   * Pretty-print a JSON string, or return it unchanged if it is not JSON.
   */
  function formatJson(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  /**
   * A react component that renders a labelled, copyable JSON payload.
   */
  function Payload(props: { label: string; code: string }): ReactNode {
    // Extract the props.
    const { label, code } = props;

    // Return the rendered component.
    return (
      <CodeBlock code={code} showCopyButton={false} className="w-full min-w-0">
        <CodeBlockHeader>
          <span>{label}</span>
          <CodeBlockCopyButton />
        </CodeBlockHeader>
        <CodeBlockBody maxLines={MAX_PAYLOAD_LINES} aria-label={label} />
      </CodeBlock>
    );
  }

  /**
   * A react component that renders the arguments for a tool call.
   */
  function ToolCallArgs(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Return the rendered component.
    return (
      <Payload
        label="Arguments"
        code={formatJson(toolCall.function.arguments)}
      />
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

    // Return the rendered component.
    return (
      <Payload
        label="Result"
        code={formatJson(contentToText(toolMessage?.content))}
      />
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
      select: (msgs) => {
        return (msgs ?? []).find(
          (msg) => msg.role === 'tool' && msg.toolCallId === toolCallId,
        );
      },
    });

    // Return the found tool messages, or `undefined`.
    return message as agui.ToolMessage | undefined;
  }
}
