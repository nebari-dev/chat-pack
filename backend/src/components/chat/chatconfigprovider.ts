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
 * The configuration for a chat.
 */
export
type ChatConfig = {
  /**
   * The current type of the chat.
   */
  readonly type: ChatType;

  /**
   * A callback to set the type of the chat.
   */
  readonly setType: (type: ChatType) => void;

  /**
   * The current agent id for an `agent` chat.
   */
  readonly agentId: string | undefined;

  /**
   * A callback to set the agent id.
   */
  readonly setAgentId: (agentId: string) => void;

  /**
   * The current team id for a `team` chat.
   */
  readonly teamId: string | undefined;

  /**
   * A callback to set the team id.
   */
  readonly setTeamId: (teamId: string) => void;

  /**
   * The current workflow id for a `workflow` chat.
   */
  readonly workflowId: string | undefined;

  /**
   * A callback to set the workflow id.
   */
  readonly setWorkflowId: (workflowId: string) => void;

  /**
   * The current session id for the chat.
   */
  readonly sessionId: string | undefined;

  /**
   * A callback to set the session id.
   */
  readonly setSessionId: (sessionId: string) => void;
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
