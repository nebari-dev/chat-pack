/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  type ReactNode
} from 'react';

import {
  Alerts
} from './alerts';

import {
  SensorStatus
} from './sensorstatus';

import {
  Tracks
} from './tracks';


/**
 * A react component that renders the SkyKeeper dashboard.
 */
export
function Dashboard(): ReactNode {
  return (
    <div className='grid gap-2 grid-cols-3'>
      <Alerts className='h-65' />
      <SensorStatus className='h-65 col-span-2' />
      <Tracks className='h-160 col-span-3' />
    </div>
  );
}
