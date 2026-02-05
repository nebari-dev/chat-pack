/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  EChartsOption
} from 'echarts';

import {
  JsonEditor
} from 'json-edit-react';

import {
  Hammer
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import * as api from '@/api';

import {
  cn
} from '@/lib/utils';

import {
  EChartRenderer
} from '@/components/charts/echartrenderer';

import {
  ScheduleRenderer
} from '@/components/toolrenderer/schedulerenderer';

import {
  HITLRenderer
} from '@/components/hitl/hitlrenderer';

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';

import {
  useChatRuntime
} from './chatruntimeprovider';


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

  // Create the HTIL content, if needed.
  const hitl = (
    pausedEvent ?
    <Private.HITLWrapper pausedEvent={ pausedEvent } /> :
    null
  );

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <Private.ToolAccordion toolEvents={ toolEvents } />
      { content }
      { hitl }
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
   * A type alias for the `ToolAccordion` props.
   */
  export
  type ToolAccordionProps = {
    /**
     * The completed tool call events from the event stream.
     */
    readonly toolEvents: readonly api.ToolCallCompletedEvent[];
  };

  /**
   * A react component that renders the tool accordion.
   *
   * This component allows the user to inspect the raw JSON tool data.
   */
  export
  function ToolAccordion(props: ToolAccordionProps): ReactNode {
    // Extract the props.
    const { toolEvents } = props;

    // Fetch the tool count.
    const count = toolEvents.length;

    // Bail early if there is nothing to render.
    if (count === 0) {
      return null;
    }

    // Create the JSON viewer content for the tool calls.
    const content = toolEvents.map(evt => {
      return (
        <div key={ evt.tool.tool_call_id } className='flex flex-col gap-4'>
          <div className='font-semibold'>
            { evt.tool.tool_name.toUpperCase() }
          </div>
          <JsonEditor
            className='ot-ChatPlusPlus-jer'
            data={ evt.tool }
            maxWidth='100%'
            viewOnly={ true }
            rootFontSize={ 12 }
            collapse={ true } />
        </div>
      );
    });

    // Return the rendered component.
    return (
      <Accordion type='single' collapsible>
        <AccordionItem value='tools'>
          <AccordionTrigger
            className={ cn(
              'px-2 h-6 items-center flex-0 text-nowrap text-xs rounded-md',
              'hover:no-underline cursor-pointer bg-bg-neutral-dark',
              'hover:bg-bg-neutral-default' ) }>
            <Hammer size={ 16 } />
            { `${count} TOOL${count === 1 ? '' : 'S'} CALLED` }
          </AccordionTrigger>
          <AccordionContent
            className='mt-4 p-4 flex flex-col gap-6 border rounded-md'>
            { content }
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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
      return (
        <div className="p-4 border border-red-500 rounded bg-red-50 text-red-700 text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap">
           <strong>Render Error:</strong> Unable to parse tool result.<br/>
           <strong>MIME Check:</strong> { event.tool.result && typeof event.tool.result === 'string' && event.tool.result.includes('mimeType') ? 'Found mimeType' : 'Missing mimeType' }<br/>
           <strong>Value Preview:</strong> {JSON.stringify(event.tool.result, null, 2)}
        </div>
      );
    }

    switch (mimeResult.mimeType) {
      case 'application/vnd.openteams-schedule':
        return <ScheduleRenderer result={ mimeResult as any } />;
      
      case 'application/vnd.openteams-echart':
        // Cast the mime data to the known type.
        const option = (mimeResult.data as any).option as EChartsOption;

        // Return the rendered component.
        return (
          <EChartRenderer
            option={ option }
            className='h-120 p-4 border rounded-md' />
        );

      default:
        return null;
    }
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
    // Bail if the result is empty or not a string.
    if (!result || typeof result !== 'string') {
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(result);
    } catch {
      return null;
    }

    // Bail if the result is empty or not an object.
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Check for mime type (support both camelCase and snake_case)
    const mimeType = parsed.mimeType || parsed.mime_type;
    const data = parsed.data;

    // Bail if the mime type is not a string or data is missing.
    if (!mimeType || typeof mimeType !== 'string' || !data) {
      return null;
    }

    return {
      mimeType,
      data
    };
  }

  /**
   * A type alias for the `HITLWrapper` props.
   */
  export
  type HITLWrapperProps = {
    /**
     * The api paused event that triggers the HITL renderer.
     */
    readonly pausedEvent: api.RunPausedEvent;
  };

  /**
   * A react component that wraps the HITL renderer.
   *
   * This manages the closure state needed for the renderer.
   */
  export
  function HITLWrapper(props: HITLWrapperProps): ReactNode {
    // Extract the props.
    const { pausedEvent } = props;

    // Fetch the resume run handler handler from the runtime.
    const { onResumeRun } = useChatRuntime();

    // Create the callback to handle the HITL submit.
    const handleSubmitExecutions = (exc: readonly api.ToolExecution[]) => {
      onResumeRun({
        agentId: pausedEvent.agent_id,
        runId: pausedEvent.run_id,
        sessionId: pausedEvent.session_id,
        tools: exc
      });
    };

    // Return the rendered component.
    return (
      <HITLRenderer
        pausedEvent={ pausedEvent }
        submitExecutions={ handleSubmitExecutions } />
    );
  }
}