/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';


/**
 *
 */
export
function EmptyChart(): ReactNode {
  return (
    <div className='flex h-full items-center justify-center text-xs'>
      NO DATA AVAILABLE
    </div>
  );
}
