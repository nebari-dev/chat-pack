/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  MessageSquarePlus, MessagesSquare
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  LinkCard
} from './linkcard';


/**
 * A React component that renders the explorer links for the home page.
 */
export
function Explorer(): ReactNode {
  return (
    <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4'>
      <LinkCard
        to='/chat'
        title='Chat'
        description='Chat with agents'
        icon={ <MessageSquarePlus size={ 16 } /> } />
      <LinkCard
        to='/history'
        title='History'
        description='View and manage agent history'
        icon={ <MessagesSquare size={ 16 } /> } />
    </div>
  );
}
