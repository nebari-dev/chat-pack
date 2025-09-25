/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import {
  useAppStore
} from '@/store';

import {
  ChatLogo
} from './chatlogo';

import {
  CompletionAreaMemo
} from './completionarea';

import {
  InputAreaMemo
} from './inputarea';

import './chatpanel.css';


/**
 * A React component which renders a chat panel.
 *
 * #### Notes
 * This component assumes that `chatId` exists in the store.
 */
export
function ChatPanel(props: ChatPanel.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Determine whether the chat is empty.
  const empty = useAppStore(store =>{
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Return whether the chat is empty.
    return chat.runs.length === 0;
  });

  // Create the content child for the chat panel.
  const content = (
    empty ?
    <ChatLogo /> :
    <CompletionAreaMemo chatId={ chatId } />
  );

  // Return the rendered component.
  return (
    <div className='chat-ChatPanel' data-empty={ empty }>
      <div className='chat-ChatPanel-scroller'>
        { content }
        <InputAreaMemo chatId={ chatId } />
      </div>
    </div>
  );
}


/**
 * A memoized version of `ChatPanel`.
 */
export
const ChatPanelMemo = memo(ChatPanel);


/**
 * The namespace for the `ChatPanel` component statics.
 */
export
namespace ChatPanel {
  /**
   * A type alias for the `ChatPanel` props.
   */
  export
  type Props = {
    /**
     * The id for the chat rendered by the panel.
     */
    readonly chatId: string;
  };
}
