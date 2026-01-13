/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useAssistantApi
} from '@assistant-ui/react';

import type {
  ChangeEvent, FormEvent, ReactNode
} from 'react';

import {
  memo, useCallback, useState, Fragment
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
  Field, FieldGroup, FieldLabel, FieldSeparator
} from '@/components/ui/field';

import {
  Input
} from '@/components/ui/input';

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

  // Create the state to hold the executions.
  //
  // TODO I don't like this state initialization.
  const [executions, setExecutions] = (
    useState<Record<string, api.ToolExecution>>(() => {
      const record: Record<string, api.ToolExecution> = {};
      for (const tool of event.tools) {
        if (tool.requires_confirmation || tool.requires_user_input) {
          record[tool.tool_call_id] = tool;
        }
      }
      return record;
    })
  );

  // Create the callback to set an updated tool execution.
  const setExecution = useCallback((exc: api.ToolExecution) => {
    setExecutions(prev => ({ ...prev, [exc.tool_call_id]: exc }));
  }, []);

  // Create the callback to handle the submit and resume the tool call.
  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    // Prevent default form submission.
    evt.preventDefault();
    evt.stopPropagation();

    // Resume the tool call with the user input result.
    assistantApi.part().resumeToolCall({
      agentId: event.agent_id,
      runId: event.run_id,
      sessionId: event.session_id,
      tools: Object.values(executions)
    });
  };

  // Render the tools based on their interaction requirements.
  const content = event.tools.map(tool => {
    // Render a confirmation tool.
    if (tool.requires_confirmation) {
      return (
        <Fragment key={ tool.tool_call_id }>
          <FieldGroup>
            <Private.ConfirmationToolMemo
              execution={ executions[tool.tool_call_id] ?? tool }
              setExecution={ setExecution } />
          </FieldGroup>
          <FieldSeparator />
        </Fragment>
      );
    }

    // Render a user input tool.
    if (tool.requires_user_input) {
      return (
        <Fragment key={ tool.tool_call_id }>
          <FieldGroup>
            <Private.UserInputToolMemo
              execution={ executions[tool.tool_call_id] ?? tool }
              setExecution={ setExecution } />
          </FieldGroup>
          <FieldSeparator />
        </Fragment>
      );
    }

    // Skip tools that don't need HITL.
    return null;
  });

  // Return the rendered component.
  return (
    <div className='p-4 border rounded-md flex flex-col gap-4'>
      <form
        id={ `form-${event.run_id}` }
        onSubmit={ handleSubmit }>
        <FieldGroup className='gap-4'>
          { content }
        </FieldGroup>
      </form>
      <Button
        type='submit'
        form={ `form-${event.run_id}` }
        variant='outline'
        className='rounded-md'>
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
       * The run paused event for handling HITL tools.
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
   * A common type alias for HITL tool props.
   */
  export
  type ToolProps = {
    /**
     * The tool execution object to render.
     */
    readonly execution: api.ToolExecution;

    /**
     * The callback to set the updated tool execution state.
     */
    readonly setExecution: (exc: api.ToolExecution) => void;
  };

  /**
   * A react component that renders a tool that requires confirmation.
   */
  export
  function ConfirmationTool(props: ToolProps): ReactNode {
    // Extract the props.
    const { execution, setExecution } = props;

    // Convert the confirmation state to a toggle value.
    const value = (
      execution.confirmed === true ? 'yes' :
      execution.confirmed === false ? 'no' :
      ''
    );

    // Create the callback to handle the value change.
    const handleValueChange = (value: 'yes' | 'no' | '') => {
      // Do not allow the toggle to be deselected.
      if (!value) {
        return;
      }

      // Convert the toggle value to a boolean.
      const confirmed = value === 'yes' ? true : false;

      // Update the tool execution state.
      setExecution({ ...execution, confirmed });
    };

    // Return the rendered component.
    return (
      <Card className='p-0 gap-4 border-none shadow-none'>
        <CardHeader className='px-0'>
          <CardTitle>
            { execution.tool_name.toUpperCase() }
          </CardTitle>
          <CardDescription>
            Tool requires confirmation
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type='single'
              size='lg'
              variant='outline'
              value={ value }
              onValueChange={ handleValueChange }>
              <ToggleGroupItem
                value='no'
                className='shadow-none px-2 data-[state=on]:text-red-600'>
                Deny
              </ToggleGroupItem>
              <ToggleGroupItem
                value='yes'
                className='shadow-none px-2 data-[state=on]:text-green-600'>
                Confirm
              </ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent className='px-0'>
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
                <KVTable data={ execution.tool_args } />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  /**
   * A memoized version of `ConfirmationTool`.
   */
  export
  const ConfirmationToolMemo = memo(ConfirmationTool);

  /**
   * A react component that renders a tool requiring user input.
   */
  export
  function UserInputTool(props: ToolProps): ReactNode {
    // Extract the props.
    const { execution, setExecution } = props;

    // Create the callback to update the schema.
    const setSchema = (index: number, schema: api.UserInputSchema) => {
      // Clone the input schema array.
      const user_input_schema = [ ...execution.user_input_schema! ];

      // Overwrite the modified schema.
      user_input_schema[index] = schema;

      // Update the tool execution.
      setExecution({ ...execution, user_input_schema });
    };

    // Create the input schema components.
    const content = execution.user_input_schema!.map((schema, i) => {
      return (
        <UserInputSchemaMemo
          key={ i }
          index={ i }
          schema={ schema }
          setSchema={ setSchema } />
      );
    });

    // Return the rendered component.
    return (
      <Card className='p-0 border-none gap-4 shadow-none'>
        <CardHeader className='px-0'>
          <CardTitle>
            { execution.tool_name.toUpperCase() }
          </CardTitle>
          <CardDescription>
            Tool requires user input
          </CardDescription>
        </CardHeader>
        <CardContent className='px-0 flex flex-col gap-4'>
          { content }
        </CardContent>
      </Card>
    );
  }

  /**
   * A memoized version of `UserInputTool`.
   */
  export
  const UserInputToolMemo = memo(UserInputTool);

  /**
   * A type alias for the `UserInputSchema` props.
   */
  type UserInputSchemaProps = {
    /**
     * The index of the schema in the schemas array.
     */
    readonly index: number;

    /**
     * The user input schema to render.
     */
    readonly schema: api.UserInputSchema;

    /**
     * A callback to set the updated schema data.
     */
    readonly setSchema: (index: number, schema: api.UserInputSchema) => void;
  };

  /**
   * A react component that renders a user input schema.
   */
  function UserInputSchema(props: UserInputSchemaProps): ReactNode {
    // Extract the props.
    const { index, schema, setSchema } = props;

    // Guard against unhandled field types.
    if (schema.field_type !== 'str') {
      return (
        <>
          <FieldLabel className='text-xs text-muted-foreground'>
            <span>
              { `${schema.name.toUpperCase()}:` }
            </span>
            <span>
              { schema.description }
            </span>
          </FieldLabel>
          <Field>
            { `Unhandled field type: ${schema.field_type}` }
          </Field>
        </>
      );
    }

    // Create the border color for the input.
    const borderColor = (
      schema.value !== null ?
      'focus-visible:border-bd-brand-default' :
      'border-red-500 focus-visible:border-red-500'
    );

    // Create the change handler callback.
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setSchema(index, { ...schema, value: event.target.value });
    };

    // Return the rendered component.
    return (
      <>
        <FieldLabel className='text-xs text-muted-foreground flex gap-2'>
          <span>
            { `${schema.name.toUpperCase()}:` }
          </span>
          <span>
            { schema.description }
          </span>
        </FieldLabel>
        <Field>
          <Input
            className={ `rounded-xs focus-visible:ring-0 ${borderColor}` }
            value={ schema.value ?? '' }
            onChange={ handleChange } />
        </Field>
      </>
    );
  }

  /**
   * A memoized version of `UserInputSchema`.
   */
  const UserInputSchemaMemo = memo(UserInputSchema);
}
