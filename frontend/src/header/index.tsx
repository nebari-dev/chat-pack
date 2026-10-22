/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createLink } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import {
  MenuBarActions,
  MenuBarBrand,
  NavigationMenu,
} from '@/components/ui/navigation-menu';
import { getAppConfig } from '@/config';
import { useTheme } from '@/hooks/theme-provider';
import logoDark from '/assets/nebari-logo_dark.svg';
import logoLight from '/assets/nebari-logo_light.svg';
import { AccountMenu } from './accountmenu';

/**
 * The Nebari brand link, made router-aware so it navigates without a reload.
 */
const BrandLink = createLink(MenuBarBrand);

/**
 * A React component that renders the app header.
 *
 * It follows the canonical Nebari header recipe so the app reads as one
 * product with the other Nebari apps in a deployment: brand on the left and
 * the account menu on the right. There is no center navigation because the
 * sidebar already lists every destination.
 */
export function Header(): ReactNode {
  // Resolve the logo. Dark mode prefers the dark custom logo, then the
  // general custom logo, then the built-in dark logo.
  const { isDarkMode } = useTheme();
  const branding = getAppConfig()?.branding;
  const logoSrc = isDarkMode
    ? (branding?.logoUrlDark ?? branding?.logoUrl ?? logoDark)
    : (branding?.logoUrl ?? logoLight);

  return (
    <NavigationMenu className="h-14 flex-none justify-between border-border bg-header pl-4 text-header-foreground">
      <BrandLink to="/" aria-label={`${branding?.title || 'Nebari Chat'} home`}>
        <img
          src={logoSrc}
          alt=""
          className="h-8 w-auto max-w-[160px] object-contain"
        />
      </BrandLink>
      <MenuBarActions className="gap-2">
        <AccountMenu />
      </MenuBarActions>
    </NavigationMenu>
  );
}
