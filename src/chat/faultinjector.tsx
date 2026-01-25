/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  type ReactNode
} from 'react';

import {
  pb
} from '@/api/pb';

import {
  Button
} from '@/components/ui/button';

import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';

import {
  cn
} from '@/lib/utils';


/**
 * A react component that renders the Fault Injector card.
 */
export
function FaultInjector(props: FaultInjector.Props): ReactNode {
  // Extract the props.
  const { className } = props;

  // Return the rendered component.
  return (
    <Card className={ cn(
      'min-w-0 min-h-40 gap-2 py-4 rounded-sm', className) }>
      <CardHeader className='px-4'>
        <CardTitle>
          Fault Injector
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 grow min-h-0f flex flex-col gap-2'>
        <Button
          variant='destructive'
          className='cursor-pointer bg-red-700'
          onClick={ Private.injectLatencyFault }>
          Latency Spike
        </Button>
        <Button
          variant='destructive'
          className='cursor-pointer bg-red-700'
          onClick={ Private.injectPacketFault }>
          Packet Loss
        </Button>
        <Button
          variant='destructive'
          className='cursor-pointer bg-red-700'
          onClick={ Private.injectClockFault }>
          Clock Skew
        </Button>
        <Button
          className='cursor-pointer bg-green-700 hover:bg-green-600'
          onClick={ Private.clearFaults }>
          Clear Faults
        </Button>
      </CardContent>
    </Card>
  );
}


/**
 * The namespace for the `FaultInjector` statics.
 */
export
namespace FaultInjector {
  /**
   * A type alias for the `FaultInjector` props.
   */
  export
  type Props = {
    /**
     * The class name for the component.
     */
    readonly className?: string;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Hard-coded sensor ids for the demo.
   */
  const SENSOR_IDS = ['EO1', 'EO2', 'R1', 'R2'];

  /**
   * Select a random sensor id.
   */
  function randomSensorId(): string {
    return SENSOR_IDS[Math.floor(Math.random() * SENSOR_IDS.length)];
  }

  /**
   * A function to inject a latency sensor fault.
   */
  export
  function injectLatencyFault(): void {
    fetch('/api/api/fault/inject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      },
      body: JSON.stringify({
        fault_type: 'latency_spike',
        sensor_id: randomSensorId()
      })
    });
  }

  /**
   * A function to inject a packet fault.
   */
  export
  function injectPacketFault(): void {
    fetch('/api/api/fault/inject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      },
      body: JSON.stringify({
        fault_type: 'packet_loss',
        sensor_id: randomSensorId()
      })
    });
  }

  /**
   * A function inject a clock fault.
   */
  export
  function injectClockFault(): void {
    fetch('/api/api/fault/inject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      },
      body: JSON.stringify({
        fault_type: 'timestamp_skew',
        sensor_id: randomSensorId()
      })
    });
  }

  /**
   * A function clear all sensor faults.
   */
  export
  function clearFaults(): void {
    fetch('/api/api/fault/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });
  }
}
