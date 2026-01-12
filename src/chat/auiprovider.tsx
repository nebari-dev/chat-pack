/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  AssistantRuntimeProvider, useExternalStoreRuntime
} from '@assistant-ui/react';

import type {
  ReactNode
} from 'react';

import {
  useThreadMessages
} from './messages';


/**
 * An Assistant-UI runtime provider for a single chat session.
 */
export
function AUIProvider(props: AUIProvider.Props): ReactNode {
  // Extract the props.
  const { children } = props;

  // Setup the thread messages.
  //
  // This hook is where the real work is done for hitting the backend
  // API and converting between backend API messages and AUI messages.
  const thread = useThreadMessages();

  // Create the runtime store adapter.
  const runtime = useExternalStoreRuntime({
    messages: thread.messages,
    isLoading: thread.isFetching,
    isRunning: thread.isPending,
    onNew: thread.onNewCallback,
    onResumeToolCall: thread.onResumeToolCall,
    convertMessage: Private.noopMessageConverter
  });

  // Return the rendered component.
  return (
    <AssistantRuntimeProvider runtime={ runtime }>
      { children }
    </AssistantRuntimeProvider>
  );
}


/**
 * The namespace for the `AUIProvider` statics.
 */
export
namespace AUIProvider {
  /**
   * The props for `AUIProvider`.
   */
  export
  type Props = {
    /**
     * The children for the provider.
     */
    readonly children?: ReactNode;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A no-op message converter.
   *
   * This makes the AUI store adapter api happy.
   */
  export
  const noopMessageConverter = <T,>(msg: T) => msg;
}
