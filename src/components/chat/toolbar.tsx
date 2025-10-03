/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  MouseEvent, ReactNode
} from 'react';

import {
  ModelSelector
} from './modelselector';

import {
  ToolSelector
} from './toolselector';

import {
  SubmitButton
} from './submitbutton';


/**
 * A React component that renders a chat toolbar.
 */
export
function Toolbar(props: Toolbar.Props): ReactNode {
  // Extract the props.
  const { model, setModel, setTools, tools, onSubmit} = props;

  // Return the rendered component.
  return (
    <div className='flex flex-row gap-3 items-end overflow-hidden'>
      <div className='flex flow-row flex-wrap flex-1 items-start gap-3'>
        <ModelSelector model={ model } setModel={ setModel } />
        <ToolSelector tools={ tools } setTools={ setTools } />
      </div>
      <SubmitButton onClick={ onSubmit } />
    </div>
  );
}


/**
 * The namespace for the `Toolbar` component statics.
 */
export
namespace Toolbar {
  /**
   * A type alias for the `Toolbar` props.
   */
  export
  type Props = {
    /**
     * The name of the model to use for the chat.
     */
    readonly model: string;

    /**
     * A callback to set the selected model.
     */
    readonly setModel: (model: string) => void;

    /**
     * The names of the enabled tools.
     */
    readonly tools: readonly string[];

    /**
     * A callback to set the enabled tools.
     */
    readonly setTools: (tools: readonly string[]) => void;

    /**
     * The click handler for the submit button.
     */
    readonly onSubmit: (event: MouseEvent) => void;
  };
}
