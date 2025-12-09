/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ListCollection
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
        <Private.BcTypes />
        <Private.BcAgents />
        <Private.BcTeams />
        <Private.BcWorkflows />
        <Private.BcSessions />
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A React component that renders the chat type selector.
   */
  export
  function BcTypes(): ReactNode {
    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Create the collection for the select.
    const collection = createListCollection({
      items: [
        { label: 'Agents', value: 'agent' as const },
        { label: 'Teams', value: 'team' as const },
        { label: 'Workflows', value: 'workflow' as const }
      ]
    });

    // Return the rendered component.
    return (
      <BcSelect
        value={ chatConfig.type }
        setValue={ chatConfig.setType }
        collection={ collection }
        labelSuffix='type' />
    );
  }

  /**
   * A React component that renders the agent selector.
   *
   * This will be `null` if the chat config `type` is not `agent` or if
   * there are no agents available in the Agno OS config.
   */
  export
  function BcAgents(): ReactNode {
    // Fetch the Agno OS config.
    const config = useConfig();

    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Bail if the chat config is not `agent`.
    if (chatConfig.type !== 'agent') {
      return null;
    }

    // Bail if the OS has no configured agents.
    if (config.agents.length === 0) {
      return null;
    }

    // Create the collection for the select.
    const collection = createListCollection({
      items: config.agents.map(a => ({
        label: a.name ?? '',
        value: a.id ?? ''
      }))
    });

    // Return the rendered component.
    return (
      <>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <BcSelect
          key={ chatConfig.agentId } // key is needed to reset the control on undefined value.
          value={ chatConfig.agentId }
          setValue={ chatConfig.setAgentId }
          collection={ collection }
          labelSuffix='agent' />
      </>
    );
  }

  /**
   * A React component that renders the team selector.
   *
   * This will be `null` if the chat config `type` is not `team` or if
   * there are no teams available in the Agno OS config.
   */
  export
  function BcTeams(): ReactNode {
    // Fetch the Agno OS config.
    const config = useConfig();

    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Bail if the chat config is not `team`.
    if (chatConfig.type !== 'team') {
      return null;
    }

    // Bail if the OS has no configured teams.
    if (config.teams.length === 0) {
      return null;
    }

    // Create the collection for the select.
    const teams = createListCollection({
      items: config.teams.map(t => ({
        label: t.name ?? '',
        value: t.id ?? ''
      }))
    });

    // Return the rendered component.
    return (
      <>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <BcSelect
          key={ chatConfig.teamId } // key is needed to reset the control on undefined value.
          value={ chatConfig.teamId }
          setValue={ chatConfig.setTeamId }
          collection={ teams }
          labelSuffix='team' />
      </>
    );
  }

  /**
   * A React component that renders the workflow selector.
   *
   * This will be `null` if the chat config `type` is not `workflow` or if
   * there are no workflows available in the Agno OS config.
   */
  export
  function BcWorkflows(): ReactNode {
    // Fetch the Agno OS config.
    const config = useConfig();

    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Bail if the chat config is not `workflow`.
    if (chatConfig.type !== 'workflow') {
      return null;
    }

    // Bail if the OS has no configured workflows.
    if (config.workflows.length === 0) {
      return null;
    }

    // Create the collection for the select.
    const collection = createListCollection({
      items: config.workflows.map(w => ({
        label: w.name ?? '',
        value: w.id ?? ''
      }))
    });

    // Return the rendered component.
    return (
      <>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <BcSelect
          key={ chatConfig.workflowId } // key is needed to reset the control on undefined value.
          value={ chatConfig.workflowId }
          setValue={ chatConfig.setWorkflowId }
          collection={ collection }
          labelSuffix='workflow' />
      </>
    );
  }

  /**
   * A React component that renders the session id.
   *
   * TODO - have this render the session name instead of id.
   */
  export
  function BcSessions(): ReactNode {
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
   * A type alias for the `BcSelect` props.
   */
  type BcSelectProps<T extends string> = {
    /**
     * The selected value for the item.
     */
    readonly value: T | undefined;

    /**
     * The callback to set the selected value.
     */
    readonly setValue: (value: T) => void;

    /**
     * The collection for populating the values.
     */
    readonly collection: ListCollection<{ label: string, value: T }>;

    /**
     * The suffix to add to the `Select ${suffix}` label.
     */
    readonly labelSuffix: string;
  };

  /**
   * A React component that renders a breadcrumb select item.
   */
  function BcSelect<T extends string>(props: BcSelectProps<T>): ReactNode {
    // Extract the props.
    const { labelSuffix, value, setValue, collection } = props

    // Create the select items from the collection.
    const items = collection.items.map(item => (
      <Select.Item key={ item.value } item={ item }>
        { item.label }
      </Select.Item>
    ));

    // Return the rendered component.
    return (
      <Breadcrumb.Item>
        <Select.Root
          collection={ collection }
          size='sm'
          width='160px'
          value={ value ? [value] : undefined }
          onValueChange={ e => { setValue(e.value[0] as T) } }>
          <Select.HiddenSelect />
          <VisuallyHidden>
            <Select.Label>{ `Select ${labelSuffix}` }</Select.Label>
          </VisuallyHidden>
          <Select.Control>
            <Select.Trigger minH='0' border='none' cursor='pointer'>
              <Select.ValueText placeholder={`Select ${labelSuffix}`} />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <ChevronsUpDown size={16} />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                { items }
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Breadcrumb.Item>
    );
  }
}
