/*-----------------------------------------------------------------------------
| SignalCard
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { AlertTriangle, BrainCircuit } from 'lucide-react';

export type SignalCardData = {
  readonly id: string;
  readonly student: string;
  readonly type: 'ACADEMIC' | 'WELLNESS';
  readonly severity: 'low' | 'medium' | 'high';
  readonly summary: string;
  readonly details: readonly string[];
  readonly timestamp: string;
};

const DEFAULT_SIGNAL: SignalCardData = {
  id: 'signal-001',
  student: 'Alex Martinez',
  type: 'ACADEMIC',
  severity: 'medium',
  summary: 'Alex is struggling with fractions during independent practice.',
  details: [
    'Needed reteach on denominators changing while numerators stay the same.',
    'Requested extra time on last exit ticket.',
    'Confidence dropped after second incorrect attempt.',
  ],
  timestamp: 'Today • 1:42 PM',
};

const severityMap: Record<SignalCardData['severity'], string> = {
  low: 'text-emerald-700 bg-emerald-100',
  medium: 'text-amber-700 bg-amber-100',
  high: 'text-red-700 bg-red-100',
};


export function SignalCard({ data = DEFAULT_SIGNAL }: { readonly data?: SignalCardData }): ReactNode {
  const Icon = data.type === 'ACADEMIC' ? BrainCircuit : AlertTriangle;
  return (
    <section className='rounded-xl border border-bd-neutral-default bg-white p-5 shadow-sm space-y-3'>
      <header className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs uppercase tracking-wide text-gray-500'>Signal • {data.type}</p>
          <h3 className='text-lg font-semibold text-gray-900'>{data.student}</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${severityMap[data.severity]}`}>
          <Icon size={16} /> {data.severity.toUpperCase()}
        </span>
      </header>
      <p className='text-sm text-gray-700'>{data.summary}</p>
      <ul className='space-y-1 text-sm text-gray-600'>
        {data.details.map(line => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
      <footer className='text-xs text-gray-500'>{data.timestamp}</footer>
    </section>
  );
}
