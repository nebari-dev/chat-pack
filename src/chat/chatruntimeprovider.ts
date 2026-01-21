/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';

import type {
  ChatConfig
} from './chatconfigprovider';


/**
 * A type alias for the chat runtime.
 */
export
type ChatRuntime = ChatConfig & {
  /**
   * The session runs for the chat.
   */
  readonly runs: readonly api.SessionRun[];

  /**
   * A callback to submit a new user message to the session.
   */
  readonly onUserSubmit: (prompt: string) => void;
};


/**
 * The chat runtime provider.
 */
export
const ChatRuntimeProvider = createContext<ChatRuntime | undefined>(undefined);


/**
 * A hook which returns the chat runtime.
 */
export
function useChatRuntime(): ChatRuntime {
  const runtime = useContext(ChatRuntimeProvider);
  if (runtime === undefined) {
    throw new Error('missing `ChatRuntimeProvider`');
  }
  return runtime;
}
