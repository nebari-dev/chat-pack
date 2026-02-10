/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';


/**
 * The configuration for a chat.
 */
export
type ChatConfig = {
  /**
   * The unique id of the selected agent.
   */
  readonly agentId: string;

  /**
   * The unique id for the session.
   */
  readonly sessionId: string | undefined;

  /**
   * A callback to update the chat config.
   */
  readonly update: (options: ChatConfig.UpdateOptions) => void;
};


/**
 * The namespace for the `ChatConfig` statics.
 */
export
namespace ChatConfig {
  /**
   * A type alias for the `update()` options.
   */
  export
  type UpdateOptions = {
    /**
     * The unique id of the agent.
     */
    readonly agentId: string;

    /**
     * The id for the chat session.
     *
     * If this is not provided, the previous session will be cleared.
     */
    readonly sessionId?: string;
  };
}


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
