/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  MouseEvent, ReactNode
} from 'react';

import * as Hrafnar from '@/hrafnar';

import {
  FilesSelector
} from './filesselector';

import {
  ModelSelector
} from './modelselector';

import {
  SubmitButton
} from './submitbutton';

import './toolbar.css';


/**
 * A React component that renders a chat tool bar.
 */
export
function ToolBar(props: ToolBar.Props): ReactNode {
  // Extract the props.
  const { selectedFiles, setSelectedFiles, model, setModel, onSubmit} = props;

  // Return the rendered component.
  return (
    <div className='chat-ToolBar'>
      <div className='chat-ToolBar-content'>
        <FilesSelector selectedFiles={ selectedFiles } setSelectedFiles={ setSelectedFiles } />
        <ModelSelector model={ model } setModel={ setModel } />
      </div>
      <SubmitButton onClick={ onSubmit } />
    </div>
  );
}


/**
 * The namespace for the `ToolBar` component statics.
 */
export
namespace ToolBar {
  /**
   * A type alias for the `ToolBar` props.
   */
  export
  type Props = {
    /**
     *
     */
    readonly selectedFiles: readonly Hrafnar.FileInfo[];

    /**
     *
     */
    readonly setSelectedFiles: (files: readonly Hrafnar.FileInfo[]) => void;

    /**
     *
     */
    readonly model: Hrafnar.Model | null;

    /**
     *
     */
    readonly setModel: (model: Hrafnar.Model | null) => void;

    /**
     * The click handler for the submit button.
     */
    readonly onSubmit: (event: MouseEvent) => void;
  };
}
