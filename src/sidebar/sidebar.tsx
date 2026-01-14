/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useCallback, useState
} from 'react';

import {
  useContext
} from 'react';

import {
  cn
} from '@/lib/utils';

import {
  Header
} from './header';

import {
  Launcher
} from './launcher';

import {
  UserCard
} from './usercard';

import {
  AuthContext
} from '@/login/authconfigprovider'

/**
 * A React component that renders the chat sidebar.
 */
export
function Sidebar(): ReactNode {
  // Get the auth context for the user info
  const context = useContext(AuthContext);
  
  // Setup the state to track the sidebar open state.
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Create the toggle handler for the sidebar state.
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Return the rendered component.
  return (
    <div className={cn(
      'flex flex-col flex-none justify-between border-r border-bd-neutral-default',
      'bg-bg-white transition-[width] duration-150',
      isSidebarOpen ? 'w-60' : 'w-12.25')}>
      <div className={'gap-3'}>
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Launcher isSidebarOpen={isSidebarOpen} />
      </div>
      
      <UserCard isSidebarOpen={isSidebarOpen} context={context}/>
    </div>
  );
}
