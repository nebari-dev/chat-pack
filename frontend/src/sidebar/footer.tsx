/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';

/**
 * A React component that renders the sidebar footer, which holds the
 * collapse toggle.
 */
export function Footer(): ReactNode {
  return (
    <SidebarFooter className="border-sidebar-border border-t bg-sidebar">
      <SidebarTrigger className="[&_svg]:size-4" />
    </SidebarFooter>
  );
}
