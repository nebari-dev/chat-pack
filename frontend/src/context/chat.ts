/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createContext, useContext } from 'react';

import type * as api from '@/api';

/**
 * The configuration for the chat page.
 */
export type ChatConfig = {
  /**
   * The loaded thread object for the `/chat` `threadId` search param.
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

  /**
   * The id of the message to show as a detail in the chat sidebar.
   *
   * This is not guaranteed by the loader to be a valid message id.
   * i.e. it might not reference an actual message in the thread.
   * Consumers should account for that possibility.
   */
  readonly detailId: string | undefined;

  /**
   * Whether the tools panel is open in the chat sidebar.
   *
   * When `true`, the chat renders the tools panel (available tools
   * and capabilities) in place of the message detail sidebar.
   *
   * This can be changed by navigating to the `/chat` route with the
   * desired `showTools` search param.
   */
  readonly showTools: boolean | undefined;
};

/**
 * The chat config context.
 */
export const ChatConfigContext = createContext<ChatConfig | undefined>(
  undefined,
);

/**
 * A hook which returns the chat config.
 */
export function useChatConfig(): ChatConfig {
  const config = useContext(ChatConfigContext);
  if (config === undefined) {
    throw new Error(
      '`useChatConfig` must be called within a `ChatConfigContext`',
    );
  }
  return config;
}
