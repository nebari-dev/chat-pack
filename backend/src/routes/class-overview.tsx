/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/class-overview')({
  component: ClassOverviewRoute,
});


function ClassOverviewRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='Class Overview'
      subtitle={`Viewing as ${user.name} (${user.persona})`}>
      <p>Class analytics and rosters will surface here.</p>
    </RoleViewShell>
  );
}
