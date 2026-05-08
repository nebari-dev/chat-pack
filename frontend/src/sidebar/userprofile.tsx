/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ChevronsUpDown
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  Link
} from '@tanstack/react-router';

import * as auth from '@/auth';

import {
  Avatar, AvatarFallback
} from '@/components/ui/avatar';

import {
  Button
} from '@/components/ui/button';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';


/**
 * A react component that renders the user profile in the sidebar.
 */
export
function UserProfile(props: UserProfile.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen } = props;

  // Get the user profile.
  const profile = auth.getUserProfile();

  // Bail early if the user is not logged in.
  if (!profile) {
    return null;
  }

  // Create the extra content when the sidebar is open.
  const content = (
    isSidebarOpen ?
      <>
        <span className='truncate'>
          { profile.name }
        </span>
        <span className='grow' />
        <ChevronsUpDown />
      </>
    : null
  );

  // Return the rendered component.
  return (
    <div className='border-t'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-12 cursor-pointer w-full rounded-none'>
            <Avatar>
              <AvatarFallback className='bg-black text-muted'>
                { profile.name.charAt(0).toUpperCase() }
              </AvatarFallback>
            </Avatar>
            { content }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          alignOffset={ 12 }
          className='min-w-60 rounded-sm'>
          <DropdownMenuLabel>
            { profile.email }
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive'>
            <Link to='/logout' preload={ false } className='w-full'>
              Logout
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


/**
 * The namespace for the `UserProfile` statics.
 */
export
namespace UserProfile {
  /**
   * A type alias for the `UserProfile` props.
   */
  export
  type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;
  };
}
