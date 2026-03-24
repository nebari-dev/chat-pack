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
  Hammer
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  cn
} from '@/lib/utils';

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';

import {
  useChatConfig
} from '@/context';

import {
  threadMessagesQuery
} from '@/queries';


/**
 * A react component that renders the tool executions for a run.
 */
export
function ToolCallsRenderer(props: ToolCallsRenderer.Props): ReactNode {
  // Extract the props.
  const { toolCalls } = props;

  // Bail early if there is nothing to render.
  if (toolCalls.length === 0) {
    return null;
  }

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <Private.ToolCallsAccordion toolCalls={ toolCalls } />
    </div>
  );
}


/**
 * The namespace for the `ToolCallsRenderer` statics.
 */
export
namespace ToolCallsRenderer {
  /**
   * A type alias for the `ToolCallsRenderer` props.
   */
  export
  type Props = {
    /**
     * The tool calls for the message.
     */
    readonly toolCalls: readonly agui.ToolCall[];
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the `ToolCallsAccordion` props.
   */
  export
  type ToolCallsAccordionProps = {
    /**
     * The tool calls for the message.
     */
    readonly toolCalls: readonly agui.ToolCall[];
  };

  /**
   * A react component that renders the tool calls accordion.
   *
   * This component allows the user to inspect the raw JSON tool data.
   */
  export
  function ToolCallsAccordion(props: ToolCallsAccordionProps): ReactNode {
    // Extract the props.
    const { toolCalls } = props;

    // Get the number of tools called.
    //
    // The parent enforces this to be `> 0`.
    const count = toolCalls.length;

    // Create the tool call items for the accordion.
    const items = toolCalls.map(tc =>
      <ToolCallItem key={ tc.id } toolCall={ tc } />
    );

    // Return the rendered component.
    return (
      <Accordion type='single' collapsible>
        <AccordionItem value='tools'>
          <AccordionTrigger
            className={ cn(
              'px-2 py-1 gap-2 items-center flex-0 text-nowrap text-xs',
              'rounded-sm cursor-pointer bg-bg-neutral-dark',
              'hover:no-underline hover:bg-bg-neutral-default' ) }>
            <Hammer size={ 14 } />
            { `${count} TOOL${count === 1 ? '' : 'S'} CALLED` }
          </AccordionTrigger>
          <AccordionContent
            className='mt-4 p-4 flex flex-col gap-6 border rounded-md'>
            { items }
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  /**
   * A react component that renders the item for a tool call.
   */
  function ToolCallItem(props: ToolCallItem.Props): ReactNode {
    // Extract the props.
    const { toolCall } = props;

    // Return the rendered component.
    return (
      <div className='flex flex-col gap-4'>
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
        collapse={ false } />
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
