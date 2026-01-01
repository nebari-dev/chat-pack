/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import { useMockUser } from '@/components/auth';
import { LessonPlanArtifact, SignalCard } from '@/components/artifacts';
import { RoleViewShell } from '@/components/ui/role-view-shell';


export const Route = createFileRoute('/teacher-planning')({
  component: TeacherPlanningRoute,
});


function TeacherPlanningRoute() {
  const { user } = useMockUser();
  return (
    <RoleViewShell
      title='Teacher Planning'
      subtitle={`Viewing as ${user?.name ?? 'Unknown'} (${user?.persona ?? ''})`}>
      <div className='space-y-4'>
        <LessonPlanArtifact />
        <SignalCard data={{
          id: 'signal-academic',
          student: 'Alex Martinez',
          type: 'ACADEMIC',
          severity: 'medium',
          summary: 'Needs targeted small-group support on equivalent fractions before Friday quiz.',
          details: [
            'Misidentified 2/4 as less than 1/2 on exit ticket.',
            'Requested concrete manipulatives twice during independent work.',
          ],
          timestamp: 'Logged 2 hours ago',
        }} />
      </div>
    </RoleViewShell>
  );
}
