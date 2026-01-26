/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  EChartsOption
} from 'echarts';

import {
  ChevronRight
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import * as api from '@/api';

import {
  Button
} from '@/components/ui/button';

import {
  cn
} from '@/lib/utils';

import {
  EChartRenderer
} from '@/components/charts/echartrenderer';

import {
  HITLRenderer
} from '@/components/hitl/hitlrenderer';


/**
 * A react component that renders the tool executions for a run.
 */
export
function ToolsRenderer(props: ToolsRenderer.Props): ReactNode {
  // Extract the props.
  const { events } = props;

  // Filter the events.
  const { toolEvents, pausedEvent } = Private.filterEvents(events);

  // Bail early if there is nothing to render.
  if (toolEvents.length === 0 && pausedEvent === null) {
    return null;
  }

  // Dispatch the tool events to their renderers.
  const content = toolEvents.map(evt =>
    <Private.ToolRendererDispatchMemo
      key={ evt.tool.tool_call_id }
      event={ evt } />
  );

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <Private.ToolCountRenderer toolEvents={ toolEvents } />
      { content }
      {
        pausedEvent ?
        <HITLRenderer pausedEvent={ pausedEvent } /> :
        null
      }
    </div>
  );
}


/**
 * The namespace for the `ToolsRenderer` statics.
 */
export
namespace ToolsRenderer {
  /**
   * A type alias for the `ToolsRenderer` props.
   */
  export
  type Props = {
    /**
     * The api events for the run.
     */
    readonly events: readonly api.RunEvent[];
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the result of `filterEvents`.
   */
  export
  type FilterEventsResult = {
    /**
     * The completed tool call events from the event stream.
     */
    readonly toolEvents: readonly api.ToolCallCompletedEvent[];

    /**
     * The run paused event for HITL tool calls.
     *
     * This will only be returned if the paused event is the *last* event
     * in the event stream, indicating the HITL tool needs to be rendered.
     * Otherwise, it will be `null`.
     */
    readonly pausedEvent: api.RunPausedEvent | null;
  };

  /**
   * A function that filters the event stream for relevant tool calls.
   */
  export
  function filterEvents(events: readonly api.RunEvent[]): FilterEventsResult {
    // Filter for the completed tool events.
    const toolEvents = events.filter(e => e.event === 'ToolCallCompleted');

    // Filter the paused event, if there is one at the end of the stream.
    const pausedEvent = (
      events.length > 0 && events[events.length - 1].event === 'RunPaused' ?
      events[events.length - 1] :
      null
    ) as api.RunPausedEvent | null;

    // Return the filtered results.
    return { toolEvents, pausedEvent };
  }

  /**
   * A type alias for the `ToolCountRenderer` props.
   */
  export
  type ToolCountRendererProps = {
    /**
     * The completed tool call events from the event stream.
     */
    readonly toolEvents: readonly api.ToolCallCompletedEvent[];
  };

  /**
   * A react component that renders the tool count button.
   */
  export
  function ToolCountRenderer(props: ToolCountRendererProps): ReactNode {
    // Extract the props.
    const { toolEvents } = props;

    // Fetch the tool count.
    const count = toolEvents.length;

    // Bail early if there is nothing to render.
    if (count === 0) {
      return null;
    }

    // Create the handler to open the tools viewer.
    const handleClick = () => {
      console.log('open tools viewer');
    };

    // Return the rendered component.
    return (
      <div>
        <Button
          size='sm'
          variant='outline'
          aria-label='Open tools viewer'
          onClick={ handleClick }
          className={ cn(
            'h-6 rounded-md text-xs bg-bg-neutral-dark cursor-pointer',
            'hover:bg-bg-neutral-default shadow-none' ) }>
          { `Used ${count} Tool${count === 1 ? '' : 's'}` }
          <ChevronRight />
        </Button>
      </div>
    );
  }

  /**
   * A type alias for the `ToolRendererDispatch` props.
   */
  export
  type ToolRendererDispatchProps = {
    /**
     * The tool completed event to render.
     */
    readonly event: api.ToolCallCompletedEvent;
  };

  /**
   * A react component that dispatches to a known tool renderer.
   */
  export
  function ToolRendererDispatch(props: ToolRendererDispatchProps): ReactNode {
    // Extract the props.
    const { event } = props;

    // Try to cast the result to a mime result.
    const mimeResult = castResult(event.tool.result);

    // Bail early if the cast failed.
    if (!mimeResult) {
      return null;
    }

    // Bail if mime type is not known.
    if (mimeResult.mimeType !== 'application/vnd.openteams-echart') {
      return null;
    }

    // Cast the mime data to the known type.
    const option = (mimeResult.data as any).option as EChartsOption;

    // Return the rendered component.
    return (
      <EChartRenderer
        option={ option }
        className='h-120 p-4 border rounded-md' />
    );
  }

  /**
   * A memoized version of `ToolRendererDispatch`.
   */
  export
  const ToolRendererDispatchMemo = memo(ToolRendererDispatch);

  /**
   * A type alias for a tool call mime result.
   */
  type MimeResult = {
    /**
     * The mime type of the result.
     */
    readonly mimeType: string;

    /**
     * The data payload.
     */
    readonly data: unknown;
  };

  /**
   * A function that will safely cast an unknown tool result to a mime result.
   *
   * If the cast cannot be made, this will return `null`.
   */
  export
  function castResult(result: unknown): MimeResult | null {
    // Bail if the result is empty.
    if (!result) {
      return null;
    }

    // Bail is the result type is not a string.
    if (typeof result !== 'string') {
      return null;
    }

    // Try to parse the string as JSON.
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }

    // Bail if the result is empty.
    if (!result) {
      return null;
    }

    // Bail if the result is not an object.
    if (typeof result !== 'object') {
      return null;
    }

    // Bail if the result does not have a mime type.
    if (!('mime_type' in result)) {
      return null;
    }

    // Bail if the mime type is not a string.
    if (typeof result.mime_type !== 'string') {
      return null;
    }

    // Bail if the result does not have data.
    if (!('data' in result)) {
      return null;
    }

    return { mimeType: result.mime_type, data: result.data };
  }
}
