/*-----------------------------------------------------------------------------
| CalendarEventArtifact
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { CalendarDays, Link2 } from 'lucide-react';

export type CalendarEventArtifactData = {
  readonly title: string;
  readonly student: string;
  readonly attendees: readonly string[];
  readonly date: string;
  readonly time: string;
  readonly location: string;
  readonly agenda: readonly string[];
  readonly meetLink: string;
};


const DEFAULT_DATA: CalendarEventArtifactData = {
  title: 'Family Check-in: Alex',
  student: 'Alex Martinez',
  attendees: ['Ms. Rivera', 'Alex', 'Parent/Guardian'],
  date: 'Tuesday • Dec 16, 2025',
  time: '3:30 – 4:00 PM CST',
  location: 'Counselor Zoom Room',
  agenda: [
    'Share most recent Signal summary',
    'Show updated lesson accommodations',
    'Agree on wellness strategies for the next two weeks',
  ],
  meetLink: 'https://meet.example.com/alex-checkin',
};


export function CalendarEventArtifact({ data = DEFAULT_DATA }: { readonly data?: CalendarEventArtifactData }): ReactNode {
  return (
    <section className='rounded-xl border border-bd-neutral-default bg-white p-6 shadow-sm space-y-4'>
      <header className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <p className='text-xs uppercase tracking-wide text-gray-500'>Counselor Scheduler</p>
          <h2 className='text-xl font-semibold text-gray-900'>{data.title}</h2>
          <p className='text-sm text-gray-600'>Student: {data.student}</p>
        </div>
        <span className='inline-flex items-center gap-2 rounded-full bg-bg-brand-secondary px-3 py-1 text-sm font-medium text-bd-brand-default'>
          <CalendarDays size={16} /> {data.date}
        </span>
      </header>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <p className='text-xs uppercase tracking-wide text-gray-500 mb-1'>Time</p>
          <p className='text-sm text-gray-800'>{data.time}</p>
        </div>
        <div>
          <p className='text-xs uppercase tracking-wide text-gray-500 mb-1'>Location</p>
          <p className='text-sm text-gray-800'>{data.location}</p>
        </div>
      </div>

      <div>
        <p className='text-xs uppercase tracking-wide text-gray-500 mb-2'>Attendees</p>
        <div className='flex flex-wrap gap-2'>
          {data.attendees.map(name => (
            <span key={name} className='rounded-full bg-bg-neutral-dark px-3 py-1 text-xs font-medium text-gray-700'>
              {name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className='text-xs uppercase tracking-wide text-gray-500 mb-2'>Agenda</p>
        <ul className='space-y-1 text-sm text-gray-700'>
          {data.agenda.map(item => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <a
        href={data.meetLink}
        className='inline-flex items-center gap-2 rounded-md border border-bd-brand-default px-4 py-2 text-sm font-semibold text-bd-brand-default'
      >
        <Link2 size={16} /> Join Meeting
      </a>
    </section>
  );
}
