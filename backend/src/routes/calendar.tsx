/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/calendar')({
  component: CalendarRoute,
});


function CalendarRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='Shared Calendar'
      subtitle={`Viewing as ${user.name} (${user.persona})`}>
      <p>The role-aware calendar will live here.</p>
    </RoleViewShell>
  );
}
