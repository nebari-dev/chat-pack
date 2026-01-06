/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ThreadMessageLike
} from '@assistant-ui/react';

import {
  AssistantRuntimeProvider, useExternalStoreRuntime
} from '@assistant-ui/react';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  ThreadHistory
} from '@/components/assistant-ui/thread';


/**
 * A react component that renders the session history in the detail panel.
 */
export
function HistoryRenderer(props: HistoryRenderer.Props): ReactNode {
  // Extract the props.
  const { detail } = props;

  // TODO support team and workflow sessions.
  if (detail.type !== 'agent') {
    return null;
  }

  // Convert the messages to AUI messages.
  const messages = Private.convertMessages(detail.chat_history);

  // Create the AUI runtime.
  const runtime = useExternalStoreRuntime({
    messages,
    isLoading: false,
    isRunning: false,
    onNew: async () => {},
    convertMessage: m => m
  });

  // Return the rendered component.
  return (
    <div className='grow min-h-0'>
      <AssistantRuntimeProvider runtime={ runtime }>
        <ThreadHistory />
      </AssistantRuntimeProvider>
    </div>
  );
}


/**
 * The namespace for the `HistoryRenderer` statics.
 */
export
namespace HistoryRenderer {
  /**
   * A type alias for the `HistoryRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert chat history messages to AUI messages.
   */
  export
  function convertMessages(msgs: api.ChatHistoryMessage[]): ThreadMessageLike[] {
    // Create the array to hold the converted messages.
    const result: ThreadMessageLike[] = [];

    // Convert the messages, skipping those with empty content. Those messages
    // are typically tool calls, which we don't need to show in the history.
    for (const { role, content } of msgs) {
      if (content) {
        result.push({ role, content });
      }
    }

    // Return the converted messages.
    return result;
  }
}
