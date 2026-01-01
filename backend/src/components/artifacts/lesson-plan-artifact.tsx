/*-----------------------------------------------------------------------------
| LessonPlanArtifact
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';


export type LessonPlanArtifactData = {
  readonly lessonTitle: string;
  readonly gradeBand: string;
  readonly standard: string;
  readonly objectives: readonly string[];
  readonly agenda: readonly { step: string; detail: string }[];
  readonly parentLetter: {
    readonly greeting: string;
    readonly summary: string;
    readonly talkingPoints: readonly string[];
    readonly closing: string;
  };
};


const DEFAULT_DATA: LessonPlanArtifactData = {
  lessonTitle: 'Fractions as Equal Parts',
  gradeBand: 'Grade 4 • Math',
  standard: 'CCSS.MATH.CONTENT.4.NF.B.3',
  objectives: [
    'Explain why two fractions are equivalent using models',
    'Compare fractions with unlike denominators',
    'Use sentence frames to describe reasoning aloud',
  ],
  agenda: [
    { step: 'Warm-Up', detail: 'Number talk: show 1/2, 2/4, 3/6 and discuss equivalence.' },
    { step: 'Mini Lesson', detail: 'Model splitting rectangles into equal parts using manipulatives.' },
    { step: 'Guided Practice', detail: 'Students sort fraction cards into “same value” stacks.' },
    { step: 'Exit Ticket', detail: 'Write a fraction story problem using Alex’s scenario.' },
  ],
  parentLetter: {
    greeting: 'Dear Families,',
    summary: 'Alex is practicing how different fractions can name the same amount. Encouragement at home helps reinforce confidence.',
    talkingPoints: [
      'Ask your child to draw a pizza cut two different ways that still feeds four friends.',
      'Play “fraction war” with a deck of cards (face cards = 10).',
      'Celebrate mistakes — they show where we get to grow!',
    ],
    closing: 'Thank you for teaming with us — Ms. Rivera & Mr. Holmes',
  },
};


export function LessonPlanArtifact(props: { readonly data?: LessonPlanArtifactData }): ReactNode {
  const { data = DEFAULT_DATA } = props;

  return (
    <section className='rounded-xl border border-bd-neutral-default bg-white p-6 shadow-sm space-y-6'>
      <header className='space-y-1'>
        <p className='text-xs uppercase tracking-wide text-gray-500'>{data.gradeBand}</p>
        <h2 className='text-2xl font-semibold text-gray-900'>{data.lessonTitle}</h2>
        <p className='text-sm text-gray-600'>Standard: {data.standard}</p>
      </header>

      <div className='grid gap-6 md:grid-cols-2'>
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>Objectives</h3>
          <ul className='space-y-2'>
            {data.objectives.map(objective => (
              <li key={objective} className='flex items-start gap-2 text-gray-700'>
                <span className='mt-1 h-2 w-2 rounded-full bg-bd-brand-default flex-none' />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>Agenda</h3>
          <div className='space-y-3'>
            {data.agenda.map(item => (
              <div key={item.step} className='rounded-lg border border-bd-neutral-default px-3 py-2'>
                <p className='text-sm font-semibold text-gray-800'>{item.step}</p>
                <p className='text-sm text-gray-600'>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ParentLetter {...data.parentLetter} />
    </section>
  );
}


function ParentLetter(letter: LessonPlanArtifactData['parentLetter']): ReactNode {
  return (
    <div className='rounded-lg bg-bg-neutral-dark p-5 text-gray-800 space-y-3'>
      <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-600'>Parent Letter Draft</h3>
      <p>{letter.greeting}</p>
      <p>{letter.summary}</p>
      <div className='space-y-1'>
        {letter.talkingPoints.map(point => (
          <p key={point} className='text-sm'>• {point}</p>
        ))}
      </div>
      <p>{letter.closing}</p>
    </div>
  );
}
