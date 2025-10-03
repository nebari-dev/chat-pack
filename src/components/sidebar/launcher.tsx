/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Blocks, Database, Files, MessageSquarePlus, MessagesSquare
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useAppStore
} from '@/store';


/**
 * A React component that renders the sidebar launcher buttons.
 */
export
function Launcher(): ReactNode {
  // Fetch the sidebar state from the store.
  const sidebarState = useAppStore(store => store.sidebarState);

  // Fetch the `createChat` function from the store.
  const createChat = useAppStore(store => store.createChat);

  // Determine whether the sidebar is collapsed.
  const collapsed = sidebarState === 'collapsed';

  // Return the rendered component.
  return (
    <div className='px-2 flex flex-col flex-none gap-px'>
      <Button
        onClick={ createChat }
        collapsed={ collapsed }
        icon={ <MessageSquarePlus className='m-auto' size={ 20 } /> }
        text='New Chat'
        className=
          'hover:bg-bg-brand-secondary text-bd-brand-default font-semibold' />
      <Button
        collapsed={ collapsed }
        icon={ <MessagesSquare className='m-auto' size={ 20 } /> }
        text='Chats'
        className='hover:bg-bg-neutral-dark' />
      <Button
        collapsed={ collapsed }
        icon={ <Files className='m-auto' size={ 20 } /> }
        text='Files'
        className='hover:bg-bg-neutral-dark' />
      <Button
        collapsed={ collapsed }
        icon={ <Database className='m-auto' size={ 20 } /> }
        text='Datasets'
        className='hover:bg-bg-neutral-dark' />
      <Button
        collapsed={ collapsed }
        icon={ <Blocks className='m-auto' size={ 20 } /> }
        text='Artifacts'
        className='hover:bg-bg-neutral-dark' />
    </div>
  );
}


/**
 * A React component that renders a launcher button.
 */
function Button(props: Button.Props): ReactNode {
  // Extract the props.
  const { collapsed, icon, text, className, onClick } = props;

  // Return the rendered component.
  return (
    <button
      onClick={ onClick }
      className={ clsx(
      'h-9 px-1 flex flex-row gap-2 items-center cursor-pointer',
      'rounded-xs whitespace-nowrap overflow-hidden', className
      ) }>
      <span className='flex-none w-6'>
        { icon }
      </span>
      <span className={ collapsed ? 'hidden' : '' }>
        { text }
      </span>
    </button>
  );
}


/**
 * The namespace for the `Button` component statics.
 */
namespace Button {
  /**
   * A type alias for the `Button` props.
   */
  export
  type Props = {
    /**
     * Whether the button is collapsed.
     */
    readonly collapsed: boolean;

    /**
     * The icon for the button.
     */
    readonly icon: ReactNode;

    /**
     * The text for the button.
     */
    readonly text: string;

    /**
     * The class name to add to the button.
     */
    readonly className?: string;

    /**
     * The click handler for the button.
     */
    readonly onClick?: () => void;
  };
}
