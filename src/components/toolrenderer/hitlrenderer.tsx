/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useAssistantApi
} from  '@assistant-ui/react';

import {
  Ban, Check
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useState
} from 'react';

import * as api from '@/api';

import {
  KVTable
} from '@/components/table/kvtable';

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';

import {
  Button
} from '@/components/ui/button';

import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';

import {
  ToggleGroup, ToggleGroupItem
} from '@/components/ui/toggle-group';


/**
 * A react component that renders Agno human-in-the-loop tools.
 */
export
function HITLRenderer(props: HITLRenderer.Props): ReactNode {
  // Extract the api event from the props.
  const event = props.result.data.event;

  // Fetch the assistant API.
  const assistantApi = useAssistantApi();

  // Create the state to hold the confirmations.
  const [confirmations, setConfirmations] = (
    useState<Record<string, Private.Confirmation>>({ })
  );

  // Create the callback to set a confirmation.
  const setConfirmation = (id: string, value: Private.Confirmation) => {
    setConfirmations(prev => ({ ...prev, [id]: value }));
  };

  // Determine whether the submit button should be enabled.
  //
  // The button is only enabled if all tool calls have a confirmation.
  const isEnabled = event.requirements.every(req => {
    return req.tool_execution.tool_call_id in confirmations;
  });

  // Create the callback to handle the submit.
  const handleSubmit = () => {
    // Extra check just to be safe.
    if (!isEnabled) {
      return;
    }

    // Create a copy of the tools with their confirmation state.
    const tools = event.requirements.map(req => {
      const c = confirmations[req.tool_execution.tool_call_id];
      const confirmed = c === 'yes' ? true : false;
      return { ...req.tool_execution, confirmed };
    });

    // Resume the tool calls with the payload.
    assistantApi.part().resumeToolCall({
      agentId: event.agent_id,
      runId: event.run_id,
      sessionId: event.session_id,
      tools
    });
  };

  // Set up the array to hold the content nodes.
  const content: ReactNode[] = [];

  // Render the tool(s) based on their interaction requirements.
  for (const req of event.requirements) {
    const exc = req.tool_execution;
    if (exc.requires_confirmation) {
      content.push(
        <Private.ConfirmationTool
          key={ req.id }
          toolCallId={ exc.tool_call_id }
          toolName={ exc.tool_name }
          toolArgs={ exc.tool_args }
          confirmation={ confirmations[exc.tool_call_id] ?? '' }
          setConfirmation={ setConfirmation } />
      );
    }
  }

  // Return the rendered component.
  return (
    <div className='p-4 border rounded-md flex flex-col gap-4'>
      { content }
      <Button
        variant='outline'
        className='rounded-md'
        disabled={ !isEnabled }
        onClick={ handleSubmit }>
        Submit
      </Button>
    </div>
  );
}


/**
 * The namespace for the `HITLRenderer` statics.
 */
export
namespace HITLRenderer {
  /**
   * A type alias for a HITL mime result.
   */
  export
  type MimeResult = {
    /**
     * The known mime type for the result.
     */
    readonly mimeType: 'application/vnd.openteams-agno-hitl';

    /**
     * The data payload for the result.
     */
    readonly data: {
      /**
       * The option object for configuring the echart.
       */
      readonly event: api.RunPausedEvent;
    };
  };

  /**
   * A type alias for the `HITLRenderer` props.
   */
  export
  type Props = {
    /**
     * The tool call result for rendering the HITL.
     */
    readonly result: MimeResult;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the confirmation state.
   */
  export
  type Confirmation = 'yes' | 'no';

  /**
   * A type alias for the `ConfirmationTool` props.
   */
  export
  type ConfirmationToolProps = {
    /**
     * The unique id for the tool call.
     */
    readonly toolCallId: string;

    /**
     * The name of the tool that needs confirmation.
     */
    readonly toolName: string;

    /**
     * The arguments for the tool that needs confirmation.
     */
    readonly toolArgs: Record<string, unknown>;

    /**
     * The state of the confirmation.
     *
     * The not-yet-chosen state is `''`.
     */
    readonly confirmation: Confirmation | '';

    /**
     * A callback to set the state of the confirmation.
     */
    readonly setConfirmation: (id: string, value: Confirmation) => void;
  };

  /**
   * A react component that renders a tool that requires confirmation.
   */
  export
  function ConfirmationTool(props: ConfirmationToolProps): ReactNode {
    // Extract the props.
    const {
      toolCallId, toolName, toolArgs, confirmation, setConfirmation
    } = props;

    // Create the callback to handle the value change.
    const handleValueChange = (value: Confirmation | '') => {
      if (value) {
        setConfirmation(toolCallId, value);
      }
    };

    // Return the rendered component.
    return (
      <Card className='rounded-md shadow-none'>
        <CardHeader>
          <CardTitle>
            { toolName.toUpperCase() }
          </CardTitle>
          <CardDescription>
            Tool requires confirmation
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type='single'
              size='sm'
              spacing={ 2 }
              value={ confirmation }
              onValueChange={ handleValueChange }>
              <ToggleGroupItem
                value='no'
                className='shadow-none px-2 data-[state=on]:text-red-600'>
                <Ban />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='yes'
                className='shadow-none px-2 data-[state=on]:text-green-600'>
                <Check />
              </ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Accordion
            type='single'
            collapsible
            defaultValue='tool-args'
            className='px-4 border rounded-md bg-bg-neutral-default'>
            <AccordionItem value='tool-args'>
              <AccordionTrigger className='py-2 hover:no-underline'>
                ARGUMENTS
              </AccordionTrigger>
              <AccordionContent>
                <KVTable data={ toolArgs } />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  }
}
