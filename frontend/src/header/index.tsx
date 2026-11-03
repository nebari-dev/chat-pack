/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import {
  MenuBarActions,
  NavigationMenu,
} from '@/components/ui/navigation-menu';

import { Brand } from './brand';

import { ProfileMenu } from './profilemenu';

/**
 * A React component that renders the app header.
 *
 * This is the canonical Nebari app header, shared across the apps in a
 * deployment so users read them as one product: the brand on the left and
 * the account menu on the right, sized and colored per the Nebari recipe.
 */
export function Header(): ReactNode {
  return (
    <NavigationMenu className="h-14 flex-none justify-between border-b border-border bg-header pl-4 text-header-foreground">
      <Brand />
      <MenuBarActions className="gap-2">
        <ProfileMenu />
      </MenuBarActions>
    </NavigationMenu>
  );
}
