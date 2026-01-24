/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import type {
  ReactNode
} from 'react';

import {
  useConfig
} from '@/config';

import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  cn
} from '@/lib/utils';

import type {
  ChatType
} from './chatconfigprovider';

import {
  useChatConfig
} from './chatconfigprovider';


/**
 * A react component that renders the header for the chat page.
 */
export
function Header(): ReactNode {
  return (
    <div className='px-4 py-2 flex flex-row border-b border-bd-neutral-default'>
      <Private.ChatSelect />
      {/*<Private.ChatSession />*/}
      <div className='grow' />
      <Private.NewChatLink />
    </div>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the agent/team/workflow select.
   */
  export
  function ChatSelect(): ReactNode {
    // Fetch the os config.
    const config = useConfig();

    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Create the value for the select.
    const value = (
      chatConfig.type && chatConfig.id ?
      `${chatConfig.type}:${chatConfig.id}` :
      ''
    );

    // Setup the callback to handle the select change.
    const handleValueChange = (value: string) => {
      // Bail if there is no selection.
      if (!value) {
        return;
      }

      // Extract the type and id for the selection.
      const [type, id] = value.split(':', 2);

      // Update the chat config.
      chatConfig.update({ type: type as ChatType, id });
    };

    // Create the array to hold the generated select groups.
    const groups: ReactNode[] = [];

    // Create the agents group.
    if (config.agents.length > 0) {
      groups.push(
        <SelectGroup key='agents'>
          <SelectLabel>Agents</SelectLabel>
            { config.agents.map(agent => (
                <SelectItem
                  key={ agent.id }
                  value={ `agent:${agent.id}` }>
                  { agent.name }
                </SelectItem>
            )) }
        </SelectGroup>
      );
    }

    // Create the teams group.
    if (config.teams.length > 0) {
      groups.push(
        <SelectGroup key='teams'>
          <SelectLabel>Teams</SelectLabel>
            { config.teams.map(team => (
                <SelectItem
                  key={ team.id }
                  value={ `team:${team.id}` }>
                  { team.name }
                </SelectItem>
            )) }
        </SelectGroup>
      );
    }

    // Create the workflows group.
    if (config.workflows.length > 0) {
      groups.push(
        <SelectGroup key='worfklows'>
          <SelectLabel>Workflows</SelectLabel>
            { config.workflows.map(workflow => (
              <SelectItem
                key={ workflow.id }
                value={ `workflow:${workflow.id}` }>
                { workflow.name }
              </SelectItem>
            )) }
        </SelectGroup>
      );
    }

    // Return the rendered component.
    return (
      <Select value={ value } onValueChange={ handleValueChange }>
        <SelectTrigger
          size='sm'
          className={ cn(
            'w-[180px] rounded-sm shadow-none focus-visible:ring-0',
            'focus-visible:border-bd-brand-default data-[size=sm]:h-7'
          ) }>
          <SelectValue placeholder='Select...' />
        </SelectTrigger>
        <SelectContent position='popper'>
          { groups }
        </SelectContent>
      </Select>
    );
  }

  /**
   * A React component that renders the chat session id.
   *
   * TODO - have this render the session name instead of id.
   */
  export
  function ChatSession(): ReactNode {
    // Fetch the chat config.
    const chatConfig = useChatConfig();

    // Bail if the session id is not defined.
    if (!chatConfig.sessionId) {
      return null;
    }

    // Return the rendered component.
    return (
      <div className='px-4 flex items-center'>
        { chatConfig.sessionId }
      </div>
    );
  }

  /**
   * A react component that renders a link to create a new chat.
   *
   * This link will retain the currently selected agent/team/workflow.
   */
  export
  function NewChatLink(): ReactNode {
    // Fetch the chat config.
    const { type, id, sessionId } = useChatConfig();

    // Determine whether the link should be disabled.
    const isDisabled = sessionId === undefined;

    // Return the rendered component.
    return (
      <Link
        to='/chat'
        className={ cn(
          'h-7 w-24 flex justify-center items-center rounded-sm text-white',
          isDisabled ? 'bg-bd-brand-default/50' : 'bg-bd-brand-default'
        ) }
        disabled={ sessionId === undefined }
        search={ { type, id } }>
        New Chat
      </Link>
    );
  }
}
