// /*-----------------------------------------------------------------------------
// | Copyright (c) 2025-present, OpenTeams Inc.
// |----------------------------------------------------------------------------*/
// import {
//   JsonEditor
// } from 'json-edit-react';

// import {
//   Hammer
// } from 'lucide-react';

// import type {
//   ReactNode
// } from 'react';

// import {
//   memo
// } from 'react';

// import * as api from '@/api';

// import {
//   cn
// } from '@/lib/utils';

// import {
//   EChartRenderer
// } from '@/components/charts/echartrenderer';

// // import {
// //   HITLRenderer
// // } from '@/components/hitl/hitlrenderer';

// import {
//   Accordion, AccordionContent, AccordionItem, AccordionTrigger
// } from '@/components/ui/accordion';

// // import {
// //   useChatRuntime
// // } from './chatruntime';


// /**
//  * A react component that renders the tool executions for a run.
//  */
// export
// function ToolsRenderer(props: ToolsRenderer.Props): ReactNode {
//   // Extract the props.
//   const { events } = props;

//   // Filter the events.
//   const { toolCallEvents, runPausedEvent } = Private.filterEvents(events);

//   // Bail early if there is nothing to render.
//   if (toolCallEvents.length === 0 && runPausedEvent === null) {
//     return null;
//   }

//   // Dispatch the tool events to their renderers.
//   const content = toolCallEvents.map(evt =>
//     <Private.ToolRendererDispatchMemo
//       key={ evt.toolCall.toolCallId }
//       event={ evt } />
//   );

//   // Create the HTIL content, if needed.
//   const hitl = (
//     runPausedEvent ?
//     <Private.HITLWrapper runPausedEvent={ runPausedEvent } /> :
//     null
//   );

//   // Return the rendered component.
//   return (
//     <div className='flex flex-col gap-4'>
//       <Private.ToolAccordion toolCallEvents={ toolCallEvents } />
//       { content }
//       { hitl }
//     </div>
//   );
// }


// /**
//  * The namespace for the `ToolsRenderer` statics.
//  */
// export
// namespace ToolsRenderer {
//   /**
//    * A type alias for the `ToolsRenderer` props.
//    */
//   export
//   type Props = {
//     /**
//      * The api events for the run.
//      */
//     readonly events: readonly api.RunEvent[];
//   };
// }


// /**
//  * The namespace for the module implementation details.
//  */
// namespace Private {
//   /**
//    * A type alias for the result of `filterEvents`.
//    */
//   export
//   type FilterEventsResult = {
//     /**
//      * The tool call events from the event stream.
//      */
//     readonly toolCallEvents: readonly api.ToolCallEvent[];

//     /**
//      * The run paused event for HITL tool calls.
//      *
//      * This will only be returned if the paused event is the *last* event
//      * in the event stream, indicating the HITL tool needs to be rendered.
//      * Otherwise, it will be `null`.
//      */
//     readonly runPausedEvent: api.RunPausedEvent | null;
//   };

//   /**
//    * A function that filters the event stream for relevant tool calls.
//    */
//   export
//   function filterEvents(events: readonly api.RunEvent[]): FilterEventsResult {
//     // Filter for the completed tool events.
//     const toolCallEvents = events.filter(e => e.type === 'tool-call');

//     // Get the run paused event, if there is one at the end of the stream.
//     const runPausedEvent = (
//       events.length > 0 && events[events.length - 1].type === 'run-paused' ?
//       events[events.length - 1] :
//       null
//     ) as api.RunPausedEvent | null;

//     // Return the filtered results.
//     return { toolCallEvents, runPausedEvent };
//   }

//   /**
//    * A type alias for the `ToolAccordion` props.
//    */
//   export
//   type ToolAccordionProps = {
//     /**
//      * The tool call events from the event stream.
//      */
//     readonly toolCallEvents: readonly api.ToolCallEvent[];
//   };

//   /**
//    * A react component that renders the tool accordion.
//    *
//    * This component allows the user to inspect the raw JSON tool data.
//    */
//   export
//   function ToolAccordion(props: ToolAccordionProps): ReactNode {
//     // Extract the props.
//     const { toolCallEvents } = props;

//     // Fetch the tool count.
//     const count = toolCallEvents.length;

//     // Bail early if there is nothing to render.
//     if (count === 0) {
//       return null;
//     }

//     // Create the JSON viewer content for the tool calls.
//     const content = toolCallEvents.map(evt => {
//       return (
//         <div key={ evt.toolCall.toolCallId } className='flex flex-col gap-4'>
//           <div className='font-semibold'>
//             { evt.toolCall.toolName.toUpperCase() }
//           </div>
//           <JsonEditor
//             className='ot-ChatPlusPlus-jer'
//             data={ evt.toolCall }
//             maxWidth='100%'
//             rootName=''
//             viewOnly={ true }
//             rootFontSize={ 12 }
//             collapse={ true } />
//         </div>
//       );
//     });

//     // Return the rendered component.
//     return (
//       <Accordion type='single' collapsible>
//         <AccordionItem value='tools'>
//           <AccordionTrigger
//             className={ cn(
//               'px-2 h-6 items-center flex-0 text-nowrap text-xs rounded-md',
//               'hover:no-underline cursor-pointer bg-bg-neutral-dark',
//               'hover:bg-bg-neutral-default' ) }>
//             <Hammer size={ 16 } />
//             { `${count} TOOL${count === 1 ? '' : 'S'} CALLED` }
//           </AccordionTrigger>
//           <AccordionContent
//             className='mt-4 p-4 flex flex-col gap-6 border rounded-md'>
//             { content }
//           </AccordionContent>
//         </AccordionItem>
//       </Accordion>
//     );
//   }

//   /**
//    * A type alias for the `ToolRendererDispatch` props.
//    */
//   export
//   type ToolRendererDispatchProps = {
//     /**
//      * The tool completed event to render.
//      */
//     readonly event: api.ToolCallEvent;
//   };

//   /**
//    * A react component that dispatches to a known tool renderer.
//    */
//   export
//   function ToolRendererDispatch(props: ToolRendererDispatchProps): ReactNode {
//     // Extract the props.
//     const { event } = props;

//     // Try to cast the result to a mime result.
//     const mimeResult = castResult(event.toolCall.result);

//     // Bail early if the cast failed.
//     if (!mimeResult) {
//       return null;
//     }

//     // Extract the mime type and mime data.
//     const { mimeType, data } = mimeResult;

//     // Dispatch to the known mimetype renderers.
//     switch (mimeType) {
//     case 'application/vnd.openteams-echart':
//       return (
//         <EChartRenderer
//           option={ (data as any).option }
//           className='h-120 p-4 border rounded-md' />
//       );
//     default:
//       return null;
//     }
//   }

//   /**
//    * A memoized version of `ToolRendererDispatch`.
//    */
//   export
//   const ToolRendererDispatchMemo = memo(ToolRendererDispatch);

//   /**
//    * A type alias for a tool call mime result.
//    */
//   type MimeResult = {
//     /**
//      * The mime type of the result.
//      */
//     readonly mimeType: string;

//     /**
//      * The data payload.
//      */
//     readonly data: unknown;
//   };

//   /**
//    * A function that will safely cast an unknown tool result to a mime result.
//    *
//    * If the cast cannot be made, this will return `null`.
//    */
//   export
//   function castResult(result: unknown): MimeResult | null {
//     // Bail if the result is not an object.
//     if (!result || typeof result !== 'object') {
//       return null;
//     }

//     // Bail if the result does not have a valid mime type.
//     if (!('mimeType' in result) || typeof result.mimeType !== 'string') {
//       return null;
//     }

//     // Bail if the result does not have data.
//     if (!('data' in result)) {
//       return null;
//     }

//     // Return the casted result.
//     return { mimeType: result.mimeType, data: result.data };
//   }

//   /**
//    * A type alias for the `HITLWrapper` props.
//    */
//   export
//   type HITLWrapperProps = {
//     /**
//      * The run paused event that triggers the HITL renderer.
//      */
//     readonly runPausedEvent: api.RunPausedEvent;
//   };

//   /**
//    *  A react component that wraps the HITL renderer.
//    *
//    * This manages the closure state needed for the renderer.
//    */
//   export
//   function HITLWrapper(props: HITLWrapperProps): ReactNode {
//     return null;
//     // // Extract the props.
//     // const { pausedEvent } = props;

//     // // Fetch the resume run handler handler from the runtime.
//     // const { onResumeRun } = useChatRuntime();

//     // // Create the callback to handle the HITL submit.
//     // const handleSubmitExecutions = (exc: readonly api.ToolExecution[]) => {
//     //   onResumeRun({
//     //     agentId: pausedEvent.agent_id,
//     //     runId: pausedEvent.run_id,
//     //     sessionId: pausedEvent.session_id,
//     //     tools: exc
//     //   });
//     // };

//     // // Return the rendered component.
//     // return (
//     //   <HITLRenderer
//     //     pausedEvent={ pausedEvent }
//     //     submitExecutions={ handleSubmitExecutions } />
//     // );
//   }
// }
