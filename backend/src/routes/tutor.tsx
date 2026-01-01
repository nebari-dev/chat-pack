/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/tutor')({
  component: TutorRoute,
});


function TutorRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='Tutor Workspace'
      subtitle={`Viewing as ${user.name} (${user.persona})`}>
      <p>The adaptive tutor experience will surface here.</p>
    </RoleViewShell>
  );
}
