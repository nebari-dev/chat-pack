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
  EventsLog
} from './eventslog';

import {
  FaultInjector
} from './faultinjector';

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
    <div className='h-full grid gap-2 grid-cols-7 grid-rows-[260px_1fr]'>
      <Alerts className='col-span-2' />
      <SensorStatus className='col-span-4' />
      <FaultInjector />
      <Tracks className='col-span-4' />
      <EventsLog className='col-span-3' />
    </div>
  );
}
