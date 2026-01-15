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
  useAuthConfig
} from '@/auth';

import {
  Link
} from '@tanstack/react-router';

import {
  Avatar, AvatarFallback, AvatarImage
} from '@/components/ui/avatar';

import {
  Button
} from '@/components/ui/button';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';


/**
 * A react component that renders the user info in the sidebar.
 */
export
function UserInfo(props: UserInfo.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen } = props;

  // Fetch the user record from the auth config.
  const { user } = useAuthConfig();

  // Bail early if the user is not logged in.
  if (!user) {
    return null;
  }

  // Get the user name to display, falling back on the email.
  const userName = (user.name || user.email) as string;

  // Create the extra user content when the sidebar is open.
  const userContent = (
    isSidebarOpen ?
      <>
        <span className='truncate'>
          { userName }
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
              <AvatarImage src={ user.avatar } />
              <AvatarFallback className='bg-black text-muted'>
                { userName.charAt(0).toUpperCase() }
              </AvatarFallback>
            </Avatar>
            { userContent }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          alignOffset={ 12 }
          className='min-w-60 rounded-sm'>
          <DropdownMenuLabel>
            { user.email }
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
 * The namespace for the `UserInfo` statics.
 */
export
namespace UserInfo {
  /**
   * A type alias for the `UserInfo` props.
   */
  export
  type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;
  };
}
