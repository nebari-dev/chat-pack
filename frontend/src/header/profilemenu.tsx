/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Link } from '@tanstack/react-router';
import { ChevronDown, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';

import * as auth from '@/auth';

import { Avatar, AvatarFallback } from '@/components/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  dropdownMenuItemVariants,
} from '@/components/ui/dropdown-menu';

import { useTheme } from '@/hooks/theme-provider';
import { isThemeMode, type ThemeMode } from '@/hooks/use-theme-preference';
import { cn } from '@/lib/utils';

/**
 * A react component that renders the account menu in the app header.
 */
export function ProfileMenu(): ReactNode {
  // Get the user profile.
  const profile = auth.getUserProfile();

  // Get the current theme preference and setter.
  const { themeMode, setThemeMode } = useTheme();

  // Bail early if the user is not logged in.
  if (!profile) {
    return null;
  }

  // Create the handler for the theme picker. Base UI types the radio value
  // loosely, so narrow it before storing.
  const handleThemeChange = (value: unknown) => {
    if (isThemeMode(value)) {
      setThemeMode(value);
    }
  };

  // Return the rendered component.
  //
  // `modal={false}` keeps the page scrollable while the menu is open, per the
  // Nebari profile menu recipe.
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        variant="ghost"
        aria-label="Account menu"
        className={cn(
          'h-auto px-2.5 py-1 hover:bg-header-action-hover hover:no-underline',
          'focus-visible:ring-offset-0 active:bg-header-action-hover',
          'data-[popup-open]:bg-header-action-hover data-[popup-open]:no-underline',
        )}
      >
        <Avatar>
          <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
            {profile.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate">{profile.name}</span>
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-[248px] p-2">
          <div className="border-b px-1.5 pb-2">
            <p className="text-sm font-medium text-foreground">
              {profile.name}
            </p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <div className="py-2">
            <MenuPrimitive.RadioGroup
              aria-label="Theme"
              value={themeMode}
              onValueChange={handleThemeChange}
              className="flex h-[34px] items-center gap-1 rounded-md bg-muted p-1"
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
            </MenuPrimitive.RadioGroup>
          </div>
          <DropdownMenuSeparator />
          <MenuPrimitive.LinkItem
            className={cn(
              dropdownMenuItemVariants(),
              'leading-5 text-sign-out-foreground data-[highlighted]:text-sign-out-foreground',
            )}
            render={<Link to="/logout" preload={false} />}
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Sign out
          </MenuPrimitive.LinkItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

/**
 * A single segmented option within the theme toggle. It is a menu radio item
 * (`role="menuitemradio"`) that only looks like a segmented control, and it
 * keeps the menu open after switching so the theme change is immediately
 * visible.
 */
function ThemeOption(props: {
  value: ThemeMode;
  label: string;
  text: string;
  children: ReactNode;
}): ReactNode {
  const { value, label, text, children } = props;

  return (
    <MenuPrimitive.RadioItem
      value={value}
      aria-label={label}
      title={label}
      closeOnClick={false}
      className={cn(
        'flex h-auto flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm border border-transparent px-1.5 py-0.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'text-muted-foreground-strong hover:text-foreground',
        'data-checked:border-border-strong data-checked:bg-card data-checked:text-foreground data-checked:shadow-[0_1px_3px_0_rgba(0,0,0,0.10)]',
      )}
    >
      {children}
      <span>{text}</span>
    </MenuPrimitive.RadioItem>
  );
}
