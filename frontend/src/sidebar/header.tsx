/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { PanelLeft } from 'lucide-react';

import type { ReactNode } from 'react';

import { getAppConfig } from '@/config';
import { useTheme } from '@/hooks/themecontext';
import { cn } from '@/lib/utils';

/**
 * A React component that renders the sidebar header.
 */
export function Header(props: Header.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen, toggleSidebar } = props;

  // Resolve the branded logo, if configured. Dark mode prefers the dark logo,
  // then the general custom logo; light mode uses the custom logo. When no
  // custom logo applies, fall back to the built-in Nebari logo (rendered as a
  // themed background image).
  const { isDarkMode } = useTheme();
  const branding = getAppConfig()?.branding;
  const logoUrl = isDarkMode
    ? (branding?.logoUrlDark ?? branding?.logoUrl)
    : branding?.logoUrl;

  // Return the rendered component with the sidebar state.
  return (
    <div
      className={cn(
        'flex flex-row flex-none h-12 p-2',
        isSidebarOpen ? 'justify-between' : 'justify-center',
      )}
    >
      {logoUrl ? (
        <Link
          to="/"
          className={cn(
            'flex items-center ml-2 cursor-pointer',
            isSidebarOpen ? '' : 'hidden',
          )}
        >
          <img
            src={logoUrl}
            alt={branding?.title ?? 'Home'}
            className="h-8 w-auto max-w-[100px] object-contain"
          />
        </Link>
      ) : (
        <Link
          to="/"
          aria-label={branding?.title || 'Home'}
          className={cn(
            'bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)] bg-[auto_100px]',
            'dark:bg-[url(/assets/Nebari-Logo-Horizontal-Lockup-Dark.svg)]',
            'bg-center bg-no-repeat w-[100px] cursor-pointer ml-2',
            isSidebarOpen ? '' : 'hidden',
          )}
        />
      )}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={isSidebarOpen}
        className="cursor-pointer w-8 rounded-sm hover:bg-bg-neutral-dark"
      >
        <PanelLeft size={20} className="m-auto" />
      </button>
    </div>
  );
}

/**
 * The namespace for the `Header` component statics.
 */
export namespace Header {
  /**
   * A type alias for the `Header` props.
   */
  export type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;

    /**
     * A callback to toggle the open state of the sidebar.
     */
    readonly toggleSidebar: () => void;
  };
}
