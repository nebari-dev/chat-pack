/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  JsonEditor
} from 'json-edit-react';

import type {
  ChangeEvent, FormEvent, ReactNode
} from 'react';

import {
  memo, useCallback, useState, Fragment
} from 'react';

import * as api from '@/api';

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
  // Extract the data from the props.
  const { pausedEvent, submitExecutions } = props;

  // Create the state to hold the executions.
  //
  // TODO - I don't like this state initialization. It assumes that
  // `tools` does not change for the lifetime of the renderer.
  const [executions, setExecutions] = (
    useState<Record<string, api.ToolExecution>>(() => {
      return pausedEvent.tools.reduce((obj, item) => (
        { ...obj, [item.tool_call_id]: item }
      ), {});
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

    // Submit the executions for continuing the run.
    submitExecutions(Object.values(executions));
  };

  // Render the tools based on their interaction requirements.
  const content = pausedEvent.tools.map(tool => {
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

    // Skip unhandled tools.
    return null;
  });

  // Return the rendered component.
  return (
    <div className='p-4 border rounded-md flex flex-col gap-4'>
      <form
        id={ `form-${pausedEvent.run_id}` }
        onSubmit={ handleSubmit }>
        <FieldGroup className='gap-4'>
          { content }
        </FieldGroup>
      </form>
      <Button
        type='submit'
        form={ `form-${pausedEvent.run_id}` }
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
   * A type alias for the `HITLRenderer` props.
   */
  export
  type Props = {
    /**
     * The api paused event for the HITL interaction.
     */
    readonly pausedEvent: api.RunPausedEvent;

    /**
     * The callback to handle the submit of the tool calls.
     */
    readonly submitExecutions: (exc: readonly api.ToolExecution[]) => void;
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
          <div className='flex flex-col gap-2'>
            <div className='text-xs font-semibold'>
              ARGUMENTS
            </div>
            <JsonEditor
              data={ execution.tool_args }
              maxWidth='100%'
              viewOnly={ true }
              rootFontSize={ 12 } />
          </div>
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
        <UserInputSchema
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
}
