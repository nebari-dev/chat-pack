/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  PropsWithChildren, ReactNode
} from 'react';

import {
  ChatInput
} from './chatinput';

import {
  ChatOutput
} from './chatoutput';

import {
  ChatRuntimeProvider
} from './chatruntimeprovider';

import {
  Header
} from './header';

import {
  useScrollToBottom
} from './usescrolltobottom';


/**
 * A component that renders the chat panel.
 */
export
function Chat(): ReactNode {
  return (
    <main className='grow flex flex-col min-w-0'>
      <ChatRuntimeProvider>
        <Header />
        <Private.Viewport>
          <ChatOutput />
          <ChatInput />
        </Private.Viewport>
      </ChatRuntimeProvider>
    </main>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the scroll viewport for the chat.
   */
  export
  function Viewport(props: PropsWithChildren): ReactNode {
    // Extract the props.
    const { children } = props;

    // Fetch the auto-scroll ref from the hook.
    const ref = useScrollToBottom();

    // Return the rendered component.
    return (
      <div
        ref={ ref }
        className='px-4 grow min-h-0 flex flex-col gap-6 overflow-y-auto'>
        { children }
      </div>
    );
  }
}
