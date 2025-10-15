/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo, useEffect, useMemo
} from 'react';

import {
  useAppStore
} from '@/store';

import {
  useShallow
} from 'zustand/react/shallow'

import {
  ChatScroller
} from './chatscroller';

import {
  DuckDuckGoOutputMemo,
  DescribeSchemaOutputMemo,
  FallbackOutputMemo,
  ToolInputPanelMemo,
} from "./tools";


/**
 * A React component that renders a tool call response.
 */
export
function ToolCallRenderer(props: ToolCallRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId, stepId } = props;

  // Fetch the response from the store.
  //
  // The parent dispatch component has already checked the type of the
  // response, so this cast is assumed to be safe.
  const {tool, parts} = useAppStore(useShallow((store) => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Get the run for the chat.
    const run = chat.runs.find(run => run.id === runId)!;

    // Get the step for run.
    const step = run.response.find(step => step.id === stepId)!;

    if (step.kind !== 'tool-call') {
      return {};
    }

    // Isolate the tools for the switch/case 
    const tool = step.data.tool;

    // Parts consist the data that will be shown
    const parts = step.parts;

    return {tool, parts}
  }));

  /**
   * Parts array consistes of 2 items input and output.
   * .find works better in this case
   * 
   * returns an object that can be passed into the leaf component
   */
  const input_part = parts?.find(part => part.kind === "tool-call-input")!;
  const output_part = parts?.find(part => part.kind === "tool-call-output")!;

  const OutputComponent = useMemo(() => {
    switch (tool) {
      case "duckduckgo_search":
        return DuckDuckGoOutputMemo;
      case "describe-schema":
        return DescribeSchemaOutputMemo;
      default:
        return FallbackOutputMemo;
    }
  }, [tool]);


  // Scroll the chat to the bottom after rendering.
  useEffect(() => {
    ChatScroller.scrollToBottom(chatId);
  }, [chatId]);

  // Return the rendered component.
  return (
  <div className="chat-ToolCallRenderer">
    <div className="chat-ToolCallRenderer-input border p-2 rounded">
      <div className="font-medium mb-1">Tool Call Input</div>
      <ToolInputPanelMemo part={input_part} />
    </div>

    <div className="chat-ToolCallRenderer-output border p-2 rounded mt-2">
      <div className="font-medium mb-1">
        Tool Call Output
      </div>
      <OutputComponent part={output_part} />
    </div>
  </div>
);
}


/**
 * A memoized version of `ToolCallRenderer`.
 */
export
const ToolCallRendererMemo = memo(ToolCallRenderer);


/**
 * The namespace for the `ToolCallRenderer` component statics.
 */
export
namespace ToolCallRenderer {
  /**
   * A type alias for the `ToolCallRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id of the chat.
     */
    readonly chatId: string;

    /**
     * The unique id of the chat run.
     */
    readonly runId: string;

    /**
     * The unique id of the chat run step.
     */
    readonly stepId: string;
  };
}
