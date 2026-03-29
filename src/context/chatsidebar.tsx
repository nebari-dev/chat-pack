/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';


/**
 * A type alias for the reasoning details in a chat sidebar context.
 */
export
type ReasoningDetail = {
  /**
   * The discriminated type of the object.
   */
  readonly type: 'reasoning';

  /**
   * The id for the ag-ui `reasoning` message of interest.
   */
  readonly messageId: string;
};


/**
 * A type alias for the tool call details in a chat sidebar context.
 */
export
type ToolCallsDetail = {
  /**
   * The discriminated type of the object.
   */
  readonly type: 'tool-calls';

  /**
   * The message id for the `assistant` message with the tools.
   */
  readonly messageId: string;
};


/**
 * A type alias for the supported chat sidebar detail types.
 */
export
type ChatSidebarConfigDetail = ReasoningDetail | ToolCallsDetail;


/**
 * A type alias for the chat sidebar config.
 */
export
type ChatSidebarConfig = {
  /**
   * The sidebar config detail to render.
   */
  readonly detail: ChatSidebarConfigDetail | null;

  /**
   * A callback to set the sidebar config detail to render.
   */
  readonly setDetail: (data: ChatSidebarConfigDetail | null) => void;
};


/**
 * The chat sidebar config context.
 */
export
const ChatSidebarConfigContext = createContext<ChatSidebarConfig | undefined>(undefined);


/**
 * A hook which returns the chat sidebar config.
 */
export
function useChatSidebarConfig(): ChatSidebarConfig {
  const value = useContext(ChatSidebarConfigContext);
  if (value === undefined) {
    throw new Error('`useChatSidebarConfig` must be called within a `ChatSidebarConfigContext`');
  }
  return value;
}
