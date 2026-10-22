/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery } from '@tanstack/react-query';

import { useNavigate } from '@tanstack/react-router';

import { ChevronDown, LogOut } from 'lucide-react';

import type { ReactNode } from 'react';

import * as auth from '@/auth';
import { Avatar, AvatarFallback, getInitials } from '@/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userQuery } from '@/queries';

import { ThemePicker } from './themepicker';

/**
 * A React component that renders the account menu in the app header.
 *
 * It follows the Nebari header recipe: avatar, name and chevron as the
 * trigger, then a name/email block, the theme picker, and a red sign-out item.
 */
export function AccountMenu(): ReactNode {
  const navigate = useNavigate();

  // Prefer the Keycloak profile. With auth disabled (local development)
  // there is none, so fall back to the backend's view of the user, which
  // always has at least an id.
  const profile = auth.getUserProfile();
  const { data: user } = useQuery(userQuery);
  const name =
    profile?.name ||
    stringClaim(user?.data, 'name') ||
    stringClaim(user?.data, 'preferred_username') ||
    user?.id ||
    'Account';
  const email = profile?.email || stringClaim(user?.data, 'email');
  const initials = getInitials(name, email);

  // Sign out through the `/logout` route, which owns the Keycloak redirect.
  const handleSignOut = () => {
    navigate({ to: '/logout' });
  };

  const identity = (
    <div className="border-b px-1.5 pb-2">
      <p className="truncate font-medium text-foreground text-sm">{name}</p>
      {email ? (
        <p className="truncate text-muted-foreground text-xs">{email}</p>
      ) : null}
    </div>
  );

  const signOut = (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="leading-5 text-sign-out-foreground data-[highlighted]:text-sign-out-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        Sign out
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        variant="ghost"
        aria-label="Account menu"
        className="h-auto px-2.5 py-1 hover:bg-header-action-hover hover:no-underline focus-visible:ring-offset-0 active:bg-header-action-hover data-[popup-open]:bg-header-action-hover data-[popup-open]:no-underline"
      >
        <Avatar>
          <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[16rem] truncate">{name}</span>
        <ChevronDown aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-[248px] p-2">
          {identity}
          <ThemePicker />
          {signOut}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

/**
 * Read a string claim from the backend user data, if present.
 */
function stringClaim(
  data: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value ? value : undefined;
}
