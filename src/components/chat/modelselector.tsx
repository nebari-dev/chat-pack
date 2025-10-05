/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Check, SlidersVertical
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import type {
  Key
} from 'react-aria-components';

import {
  Button, ListBox, ListBoxItem, Popover, Select, SelectValue
} from 'react-aria-components';

import {
  useAppStore
} from '@/store';


/**
 * A React component which renders the model selector dropdown.
 */
export
function ModelSelector(props: ModelSelector.Props): ReactNode {
  // Extract the props.
  const { model, setModel } = props;

  // Fetch the available models from the store.
  const models = useAppStore(store => store.models);

  // Create the change handler for the `Select`.
  const handleChange = (value: Key | null) => {
    if (typeof value === 'string') {
      setModel(value);
    }
  };

  // Return the rendered component.
  return (
    <Select aria-label='Model Selector' value={model} onChange={handleChange}>
     <Button className={clsx(
        'h-8 px-3 gap-2 flex flex-row items-center bg-bg-neutral-default',
        'rounded-xs border border-bd-neutral-default cursor-pointer',
        'outline-none data-focused:border-bd-brand-default',
        'whitespace-nowrap')}>
        <SlidersVertical className='size-4' />
        <SelectValue>
          {rp => rp.selectedText}
        </SelectValue>
      </Button>
      <Popover className={clsx(
        'min-w-(--trigger-width) p-1 bg-bg-white rounded-xs',
        'border border-bd-neutral-default shadow-md',
        'transition-opacity data-entering:opacity-0 data-exiting:opacity-0')}>
        <ListBox items={models}>
          {model =>
            <ListBoxItem
              id={model.name}
              textValue={model.display_name}
              className={clsx(
                'px-2 py-1.5 flex flex-row gap-2 items-center rounded-xs',
                'select-none cursor-pointer outline-none',
                'data-focused:bg-bg-neutral-dark'
                )}>
              {rp => <>
                <span className={clsx(
                  'flex-auto', rp.isSelected ? 'font-semibold' : '')}>
                  {model.display_name}
                </span>
                <span className='flex-none w-4'>
                  {rp.isSelected && <Check className='size-4' />}
                </span>
              </>}
            </ListBoxItem>}
        </ListBox>
      </Popover>
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
