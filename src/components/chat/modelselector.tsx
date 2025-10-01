/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  SlidersVertical
} from 'lucide-react';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import {
  useAppStore
} from '@/store';


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

  // Create the select items.
  const content = models.map(model =>
    <SelectItem key={ model.name } value={ model.name }>
      { model.display_name }
    </SelectItem>
  );

  // Return the rendered component.
  return (
    <Select value={ model } onValueChange={ setModel }>
      <SelectTrigger
        size={ 'sm' }
        className={ clsx(
          'bg-bg-neutral-default rounded-sm border-bd-neutral-default',
          '!text-text-neutral-default cursor-pointer'
        ) }>
        <SlidersVertical className='!text-text-neutral-default'/>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        { content }
      </SelectContent>
    </Select>
  );
}


/**
 * The namespace for the `ModelSelector` component statics.
 */
export
namespace ModelSelector {
  /**
   * A type alias for the `ModelSelector` props.
   */
  export
  type Props = {
    /**
     * The selected model for the selector.
     */
    readonly model: string;

    /**
     * The callback to set the selected model.
     */
    readonly setModel: (model: string) => void;
  };
}
