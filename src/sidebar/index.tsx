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
  cn
} from '@/lib/utils';

import {
  Header
} from './header';

import {
  Launcher
} from './launcher';

import {
  UserInfo
} from './userinfo';


/**
 * A React component that renders the application sidebar.
 */
export
function Sidebar(): ReactNode {
  // Setup the state to track the sidebar open state.
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Create the toggle handler for the sidebar state.
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Return the rendered component.
  return (
    <div className={cn(
      'flex flex-col flex-none gap-3 border-r border-bd-neutral-default',
      'bg-bg-white transition-[width] duration-150',
      isSidebarOpen ? 'w-60' : 'w-12.25')}>
      <Header
        isSidebarOpen={ isSidebarOpen }
        toggleSidebar={ toggleSidebar } />
      <Launcher isSidebarOpen={ isSidebarOpen } />
      <div className='grow' />
      <UserInfo isSidebarOpen={ isSidebarOpen } />
    </div>
  );
}
