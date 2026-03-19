/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * The configuration for the chat page.
 */
export
type ChatConfig = {
  /**
   * The thread object loaded for the `/chat` `threadId` search param.
   *
   * This can be changed by navigating to the `/chat` route with the
   * desired `threadId` search param.
   *
   * If the `threadId` search param is `undefined` this will be `null`.
   */
  readonly thread: api.Thread | null;

  /**
   * The agent id for the `/chat` `agentId` search param.
   *
   * If the `thread` is not `null`, this search param is automatically
   * synced with the agent id for the thread.
   *
   * If the `thread` is `null`, this is the agent that will be used
   * when creating a new thread.
   *
   * This can be changed by navigating to the `/chat` route with the
   * deesired `agentId` search param.
   */
  readonly agentId: string;
};


/**
 * The chat config context.
 */
export
const ChatConfigContext = createContext<ChatConfig | undefined>(undefined);


/**
 * A hook which returns the chat config.
 */
export
function useChatConfig(): ChatConfig {
  const config = useContext(ChatConfigContext);
  if (config === undefined) {
    throw new Error('`useChatConfig` must be called within a `ChatConfigContext`');
  }
  return config;
}
