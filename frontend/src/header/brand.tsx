/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createLink } from '@tanstack/react-router';

import type { ReactNode } from 'react';
import { MenuBarBrand } from '@/components/ui/navigation-menu';
import { getAppConfig } from '@/config';
import { useTheme } from '@/hooks/theme-provider';
import logoLight from '/assets/Nebari-Logo-Horizontal-Lockup.svg';
import logoDark from '/assets/Nebari-Logo-Horizontal-Lockup-Dark.svg';

/**
 * The registry brand slot is a plain anchor, so wrap it as a router link to
 * keep navigation client-side.
 */
const BrandLink = createLink(MenuBarBrand);

/**
 * An SVG view fragment that crops the built-in lockups to their artwork.
 *
 * The lockup files pad the artwork with wide transparent margins (a 1189×643
 * viewBox around a ≈610×153 mark), which would shrink it to a sliver at the
 * header's logo height. The fragment re-frames the image without editing the
 * brand asset.
 */
const LOGO_VIEW = '#svgView(viewBox(268,241,612,155))';

/**
 * A React component that renders the header brand logo, linking home.
 */
export function Brand(): ReactNode {
  // Resolve the logo. Dark mode prefers the branded dark logo, then the
  // general branded logo; light mode uses the branded logo. Without branding,
  // fall back to the built-in Nebari logo for the active theme.
  const { isDarkMode } = useTheme();
  const branding = getAppConfig()?.branding;
  const brandedLogo = isDarkMode
    ? (branding?.logoUrlDark ?? branding?.logoUrl)
    : branding?.logoUrl;
  const builtInLogo = `${isDarkMode ? logoDark : logoLight}${LOGO_VIEW}`;

  // Return the rendered component.
  return (
    <BrandLink to="/" aria-label="Go to homepage">
      <img
        src={brandedLogo ?? builtInLogo}
        alt={branding?.title || 'Nebari'}
        className="h-8 w-auto max-w-40 object-contain"
      />
    </BrandLink>
  );
}
