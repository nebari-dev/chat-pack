/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ChevronLeft, ChevronRight
} from 'lucide-react';

import type {
  ComponentProps, ReactNode
} from 'react';

import {
  cn
} from '@/lib/utils';

import {
  useMetricsConfig
} from './configprovider';


/**
 * A React component that renders the month selector for the metrics page.
 */
export
function MonthSelector(): ReactNode {
  // Fetch the metrics config.
  const { year, month, atStart, atEnd, update } = useMetricsConfig();

  // Get the date for the selection.
  const selectedTimestamp = Date.UTC(year, month - 1);
  const selectedDate = new Date(selectedTimestamp);

  // Format the label for the selected date.
  const label = Private.monthFormatter.format(selectedDate);

  // Create the callback to navigate to the previous month.
  const handlePrev = () => {
    update({
      year: month === 1 ? year - 1 : year,
      month: month === 1 ? 12 : month - 1
    });
  };

  // Create the callback to navigate to the next month.
  const handleNext = () => {
    update({
      year: month === 12 ? year + 1 : year,
      month: month === 12 ? 1 : month + 1
    });
  };

  // Return the rendered component.
  return (
    <div className='flex items-center gap-2'>
      <Private.Button disabled={ atStart } onClick={ handlePrev }>
        <ChevronLeft />
      </Private.Button>
      <span className='min-w-24 text-center text-sm font-medium'>
        { label }
      </span>
      <Private.Button disabled={ atEnd } onClick={ handleNext }>
        <ChevronRight />
      </Private.Button>
    </div>
  );
}


/**
 * The namespace for module implementation details.
 */
namespace Private {
  /**
   * A predefined month formatter for the `MonthSelector`.
   *
   * This is more efficient than using `Date.toLocaleString`.
   */
  export
  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });

  /**
   * A React component that renders a `MonthSelector` button.
   */
  export
  function Button(props: ComponentProps<'button'>): ReactNode {
    // Extract the props.
    const { className, ...rest } = props;

    // Calculate the full class name for the button.
    const fcn = cn(
      'rounded-xs border px-1 text-sm cursor-pointer',
      'disabled:opacity-40 disabled:cursor-default',
      className
    );

    // Return the rendered component.
    return <button className={ fcn } { ...rest } />;
  }
}
