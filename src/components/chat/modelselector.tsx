/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  SelectInstance
} from 'react-select';

import Select from 'react-select';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore
} from '@/store';

import './modelselector.css';


/**
 * A React component which renders the model selector dropdown.
 *
 * This component hooks into the store to get the available models.
 *
 * #### Notes
 * This is an uncontrolled component and the consumer will provide a ref
 * for the `<select>` element in order to retrieve its current value.
 */
export
function ModelSelector(props: ModelSelector.Props) {
  // Extract the props.
  const { model, setModel } = props;

  // Fetch the available models from the store.
  const models = useAppStore(store => store.models);

  // Return the rendered component.
  return (
    <Select
      className='chat-ModelSelector'
      menuPlacement='auto'
      value={ model }
      onChange={ setModel }
      getOptionLabel={ m => m.display_name }
      getOptionValue={ m => m.name }
      options={ models } />
  );
}


/**
 * The namespace for the `ModelSelector` component statics.
 */
export
namespace ModelSelector {
  /**
   * A type alias for the file selector instance.
   */
  export
  type Instance = SelectInstance<Hrafnar.Model, false>;

  /**
   * A type alias for the `ModelSelector` props.
   */
  export
  type Props = {
    /**
     * The selected model for the selector.
     */
    readonly model: Hrafnar.Model | null;

    /**
     * The callback to set the selected model.
     */
    readonly setModel: (model: Hrafnar.Model | null) => void;
  };
}
