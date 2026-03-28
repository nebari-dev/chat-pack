/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useChatSidebarConfig
} from '@/context/chatsidebar';

import {
  SidebarTools
} from './sidebartools';


/**
 * A react component that renders the chat sidebar detail.
 */
export
function ChatSidebar(): ReactNode {
  // Fetch the detail from the chat sidebar config.
  const { detail, setDetail } = useChatSidebarConfig();

  // Bail early if the config detail is `null`.
  if (detail === null) {
    return null;
  }

  // Create the close handler for the sidebar.
  const onClose = () => { setDetail(null); };

  // Create the variable to the hold the content.
  let content: ReactNode;

  // Dispatch on the detail type.
  switch (detail.type) {
  case 'tool-calls':
    content = <SidebarTools detail={ detail } onClose={ onClose } />;
    break;
  default:
    throw 'unreachable';
  }

  // Return the rendered component.
  return (
    <div className='w-160 border-l overflow-y-auto'>
      { content }
    </div>
  );
}
