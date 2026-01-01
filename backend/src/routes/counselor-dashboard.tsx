/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { CalendarEventArtifact, SignalCard } from '@/components/artifacts';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/counselor-dashboard')({
  component: CounselorDashboardRoute,
});


function CounselorDashboardRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='Wellness Dashboard'
      subtitle={`Viewing as ${user?.name ?? 'Unknown'} (${user?.persona ?? ''})`}>
      <div className='space-y-4'>
        <CalendarEventArtifact />
        <SignalCard data={{
          id: 'signal-wellness',
          student: 'Alex Martinez',
          type: 'WELLNESS',
          severity: 'low',
          summary: 'Reported feeling “stressed” before math block. Requested breathing break.',
          details: [
            'Took 3-min regulation break in counselor corner.',
            'Would like parent notified about upcoming quiz.',
          ],
          timestamp: 'Logged 45 minutes ago',
        }} />
      </div>
    </RoleViewShell>
  );
}
