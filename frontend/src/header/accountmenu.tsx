/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useNavigate } from '@tanstack/react-router';

import { ChevronDown, LogOut, User } from 'lucide-react';

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

import { ThemePicker } from './themepicker';

/**
 * A React component that renders the account menu in the app header.
 *
 * It follows the Nebari header recipe: avatar, name and chevron as the
 * trigger, then a name/email block, the theme picker, and a red sign-out item.
 * When auth is disabled there is no profile, so only the theme picker shows.
 */
export function AccountMenu(): ReactNode {
  const navigate = useNavigate();

  // The profile is `null` when auth is disabled (local development).
  const profile = auth.getUserProfile();
  const displayName = profile?.name || profile?.email || 'Account';
  const initials = getInitials(profile?.name, profile?.email);

  // Sign out through the `/logout` route, which owns the Keycloak redirect.
  const handleSignOut = () => {
    navigate({ to: '/logout' });
  };

  const identity = profile ? (
    <div className="border-b px-1.5 pb-2">
      <p className="truncate font-medium text-foreground text-sm">
        {profile.name || profile.email}
      </p>
      {profile.email ? (
        <p className="truncate text-muted-foreground text-xs">
          {profile.email}
        </p>
      ) : null}
    </div>
  ) : null;

  const signOut = profile ? (
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
  ) : null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        variant="ghost"
        aria-label="Account menu"
        className="h-auto px-2.5 py-1 hover:bg-header-action-hover hover:no-underline focus-visible:ring-offset-0 active:bg-header-action-hover data-[popup-open]:bg-header-action-hover data-[popup-open]:no-underline"
      >
        <Avatar>
          <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
            {profile ? (
              initials
            ) : (
              <User className="size-4" aria-hidden="true" />
            )}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[16rem] truncate">{displayName}</span>
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
