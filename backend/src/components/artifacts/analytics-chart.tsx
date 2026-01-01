/*-----------------------------------------------------------------------------
| AnalyticsChart
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

export type AnalyticsDatum = {
  readonly label: string;
  readonly value: number;
  readonly subtitle?: string;
};

const DEFAULT_DATA: readonly AnalyticsDatum[] = [
  { label: 'Academic Support Plans Closed', value: 72, subtitle: '+12% vs last month' },
  { label: 'Wellness Follow-ups Completed', value: 58, subtitle: '+6% vs last month' },
  { label: 'Signals Unresolved', value: 18, subtitle: 'Target < 20' },
];


export function AnalyticsChart({
  title = 'Whole School Trends',
  period = 'Rolling 30 days',
  data = DEFAULT_DATA,
}: {
  readonly title?: string;
  readonly period?: string;
  readonly data?: readonly AnalyticsDatum[];
}): ReactNode {
  return (
    <section className='rounded-xl border border-bd-neutral-default bg-white p-6 shadow-sm space-y-4'>
      <header className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <p className='text-xs uppercase tracking-wide text-gray-500'>Principal Overview</p>
          <h2 className='text-2xl font-semibold text-gray-900'>{title}</h2>
        </div>
        <span className='text-sm text-gray-600'>{period}</span>
      </header>

      <div className='space-y-4'>
        {data.map(datum => (
          <div key={datum.label}>
            <div className='flex items-center justify-between text-sm text-gray-700'>
              <span className='font-medium'>{datum.label}</span>
              <span className='font-semibold'>{datum.value}%</span>
            </div>
            <div className='mt-2 h-3 rounded-full bg-bg-neutral-dark'>
              <div
                className='h-full rounded-full bg-bd-brand-default'
                style={{ width: `${Math.min(Math.max(datum.value, 0), 100)}%` }}
              />
            </div>
            {datum.subtitle && (
              <p className='text-xs text-gray-500 mt-1'>{datum.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
