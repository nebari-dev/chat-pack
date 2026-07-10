/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Link } from '@tanstack/react-router';
import { ChevronsUpDown, Monitor, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';

import * as auth from '@/auth';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useTheme } from '@/hooks/themecontext';
import { isThemeMode, type ThemeMode } from '@/hooks/usethemepreference';
import { cn } from '@/lib/utils';

/**
 * A react component that renders the user profile in the sidebar.
 */
export function UserProfile(props: UserProfile.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen } = props;

  // Get the user profile.
  const profile = auth.getUserProfile();

  // Get the current theme preference and setter.
  const { themeMode, setThemeMode } = useTheme();

  // Bail early if the user is not logged in.
  if (!profile) {
    return null;
  }

  // Create the extra content when the sidebar is open.
  const content = isSidebarOpen ? (
    <>
      <span className="truncate">{profile.name}</span>
      <span className="grow" />
      <ChevronsUpDown />
    </>
  ) : null;

  // Return the rendered component.
  return (
    <div className="border-t">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-12 cursor-pointer w-full rounded-none"
          >
            <Avatar>
              <AvatarFallback className="bg-black text-white">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {content}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          alignOffset={12}
          className="min-w-60 rounded-sm"
        >
          <DropdownMenuLabel>{profile.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-1 py-1">
            <DropdownMenuRadioGroup
              aria-label="Theme"
              value={themeMode}
              onValueChange={(value) => {
                if (isThemeMode(value)) setThemeMode(value);
              }}
              className="flex items-center gap-1 rounded-md bg-muted p-1"
            >
              <ThemeOption value="light" label="Light mode" text="Light">
                <Sun className="size-4" />
              </ThemeOption>

              <ThemeOption value="dark" label="Dark mode" text="Dark">
                <Moon className="size-4" />
              </ThemeOption>

              <ThemeOption value="system" label="System theme" text="System">
                <Monitor className="size-4" />
              </ThemeOption>
            </DropdownMenuRadioGroup>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Link to="/logout" preload={false} className="w-full">
              Logout
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * A single segmented option within the theme toggle. Keeps the menu open after
 * switching so the theme change is immediately visible.
 */
function ThemeOption(props: {
  value: ThemeMode;
  label: string;
  text: string;
  children: ReactNode;
}): ReactNode {
  const { value, label, text, children } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      value={value}
      aria-label={label}
      title={label}
      onSelect={(event) => event.preventDefault()}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'text-muted-foreground hover:text-foreground',
        'data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm',
      )}
    >
      {children}
      <span>{text}</span>
    </DropdownMenuPrimitive.RadioItem>
  );
}

/**
 * The namespace for the `UserProfile` statics.
 */
export namespace UserProfile {
  /**
   * A type alias for the `UserProfile` props.
   */
  export type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;
  };
}
