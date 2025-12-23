/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ListCollection, SelectValueChangeDetails
} from '@chakra-ui/react';

import {
  Breadcrumb, Portal, Select, VisuallyHidden, createListCollection
} from '@chakra-ui/react';

import {
  ChevronsUpDown
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useConfig
} from '@/components/common';

import type {
  ChatType
} from './chatconfigprovider';

import {
  useChatConfig
} from './chatconfigprovider';


/**
 * A React component that renders the breadcrumbs for the panel.
 *
 * TODO - figure out Chakra styling/theming
 */
export
function Breadcrumbs(): ReactNode {
  return (
    <Breadcrumb.Root
      padding={2}
      borderBottom='1px solid var(--color-bd-neutral-default)'>
      <Breadcrumb.List>
        <Private.BcSelect />
        <Private.BcSession />
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A React component that renders the chat breadcrumb selector.
   */
  export
  function BcSelect(): ReactNode {
    // Fetch the os config.
    const config = useConfig();

    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Create the array to hold the breadcrumb items.
    const items: BcItem[] = [];

    // Populate the breadcrumb items.
    for (const agent of config.agents) {
      items.push({ type: 'agent', name: agent.name!, id: agent.id! });
    }
    for (const team of config.teams) {
      items.push({ type: 'team', name: team.name!, id: team.id! });
    }
    for (const workflow of config.workflows) {
      items.push({ type: 'workflow', name: workflow.name!, id: workflow.id! });
    }

    // Create the collection for the select.
    const collection = createListCollection({
      items,
      itemToString: item => item.name,
      itemToValue: item => `${item.type}:${item.id}`
    });

    // A type alias for the value change details.
    type Details = SelectValueChangeDetails<BcItem>;

    // Setup the callback to handle the select change.
    const handleValueChange = (details: Details) => {
      // Bail if there are no selected items.
      if (details.items.length === 0) {
        return;
      }

      // Throw an error if somehow we got multiple selections.
      if (details.items.length > 1) {
        throw new Error('Internal: unhandled multi-select');
      }

      // Extract the type and id for the selection.
      const { type, id } = details.items[0];

      // Update the chat config.
      chatConfig.update({ type, id });
    };

    // Create the value for the select.
    const value = (
      chatConfig.type && chatConfig.id ?
      `${chatConfig.type}:${chatConfig.id}` :
      ''
    );

    // Return the rendered component.
    return (
      <Breadcrumb.Item>
        <Select.Root
          collection={ collection }
          size='sm'
          width='160px'
          value={ [value] }
          onValueChange={ handleValueChange }>
          <Select.HiddenSelect />
          <VisuallyHidden>
            <Select.Label>{ 'Select...' }</Select.Label>
          </VisuallyHidden>
          <Select.Control>
            <Select.Trigger minH='0' border='none' cursor='pointer'>
              <Select.ValueText placeholder={ 'Select...' } />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <ChevronsUpDown size={ 16 } />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                <BcGroup
                  type='agent'
                  label='Agents'
                  collection={ collection } />
                <BcGroup
                  type='team'
                  label='Teams'
                  collection={ collection} />
                <BcGroup
                  type='workflow'
                  label='Workflows'
                  collection={ collection } />
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Breadcrumb.Item>
    );
  }

  /**
   * A React component that renders the session id.
   *
   * TODO - have this render the session name instead of id.
   */
  export
  function BcSession(): ReactNode {
    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Bail if the session id is not defined.
    if (!chatConfig.sessionId) {
      return null;
    }

    // Return the rendered component.
    return (
      <>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <Breadcrumb.Item whiteSpace='nowrap' overflow='ellipsis'>
          { chatConfig.sessionId }
        </Breadcrumb.Item>
      </>
    );
  }

  /**
   * A type alias for an item in the breadrumb select.
   */
  type BcItem = {
    /**
     * The type of the item.
     */
    readonly type: ChatType;

    /**
     * The display name of the item.
     */
    readonly name: string;

    /**
     * The server id of the item.
     */
    readonly id: string;
  };

  /**
   * A type alias for the `BcGroup` props.
   */
  type BcGroupProps = {
    /**
     * The chat type for the group.
     *
     * Only items with this `type` will be displayed in the group.
     */
    readonly type: ChatType;

    /**
     * The visible label for the group.
     */
    readonly label: string;

    /**
     * The list collection for the select control.
     */
    readonly collection: ListCollection<BcItem>
  };

  /**
   * A React component that renders a group in the breadcrumb select.
   */
  function BcGroup(props: BcGroupProps): ReactNode {
    // Extract the props.
    const { type, label, collection } = props;

    // Filter the collection for matching item types.
    const items = collection.items.filter(item => item.type === type);

    // Bail early if there are no matching items.
    if (items.length === 0) {
      return null;
    }

    // Create the select items for the matching collection items.
    const bcItems = items.map(item =>
      <Select.Item item={ item } key={ item.id } paddingLeft='1rem'>
        { item.name }
      </Select.Item>
    );

    // Return the rendered component.
    return (
      <Select.ItemGroup>
        <Select.ItemGroupLabel
          borderBottom='1px solid var(--color-bd-neutral-default)'>
          { label }
        </Select.ItemGroupLabel>
        { bcItems }
      </Select.ItemGroup>
    );
  }
}
