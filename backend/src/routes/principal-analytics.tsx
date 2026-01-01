/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { AnalyticsChart } from '@/components/artifacts';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/principal-analytics')({
  component: PrincipalAnalyticsRoute,
});


function PrincipalAnalyticsRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='School Analytics'
      subtitle={`Viewing as ${user?.name ?? 'Unknown'} (${user?.persona ?? ''})`}>
      <AnalyticsChart />
    </RoleViewShell>
  );
}
