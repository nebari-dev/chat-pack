/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';


/**
 * A type alias for the supported chat types.
 */
export
type ChatType = 'agent' | 'team' | 'workflow';


/**
 * A type alias for the `ChatConfig.update()` options.
 */
export
type ChatConfigUpdateOptions = {
  /**
   * The type of the chat.
   */
  readonly type: ChatType;

  /**
   * The id for the agent/team/workflow.
   */
  readonly id: string;

  /**
   * The id for the chat session.
   *
   * If this is not provided, the previous session will be cleared.
   */
  readonly sessionId?: string;
};


/**
 * The configuration for a chat.
 */
export
type ChatConfig = {
  /**
   * The current type of the chat.
   */
  readonly type: ChatType | undefined;

  /**
   * The id for the agent/team/workflow.
   */
  readonly id: string | undefined;

  /**
   * The id for the chat session.
   */
  readonly sessionId: string | undefined;

  /**
   * A callback to update the chat config.
   */
  readonly update: (options: ChatConfigUpdateOptions) => void;
};


/**
 * The chat config provider.
 */
export
const ChatConfigProvider = createContext<ChatConfig | undefined>(undefined);


/**
 * A hook which returns the chat config.
 */
export
function useChatConfig(): ChatConfig {
  const config = useContext(ChatConfigProvider);
  if (config === undefined) {
    throw new Error('missing `ChatConfigProvider`');
  }
  return config;
}
