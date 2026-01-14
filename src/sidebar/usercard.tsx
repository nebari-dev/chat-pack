/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import type {
  AuthConfig
} from '@/login/authconfigprovider';

import {
  useRouter
} from '@tanstack/react-router';

import {
  Card,
  CardContent
} from '@/components/ui/card'

import {
  Button
} from "@/components/ui/button";

export
function UserCard(props: UserCard.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen, context } = props;
  
  // Fetch the router for the current endpoint.
  const router = useRouter();

  // Get auth data from the context
  const user = context?.user;

  // Check if the user card should be shown
  if (!isSidebarOpen || !user) {
    return null;
  }

  // Return user card component
  return (
    <Card className={"w-full max-w-sm rounded-t-lg rounded-b-none"}>
      <CardContent className="flex items-center gap-4 px-2">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
          {user.avatar ? (
            <img
              src={user.avatar}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{user.email.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex flex-col">
          <span className="max-w-[155px] truncate text-base font-medium">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto px-2 text-red-600"
            onClick = {async () => {
              context.logout();
              await router.invalidate();
              router.navigate({ to: "/", replace: true });
            }}
          >
            Log out
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

export
namespace UserCard {

  export
  type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;
    
    /**
     * Auth context
     */
    readonly context: AuthConfig | undefined;
  }
}
