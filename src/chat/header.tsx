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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import {
  useChatConfig, useConfig
} from '@/context';

import {
  cn
} from '@/lib/utils';

import {
  useChatRuntime
} from './chatruntime';


/**
 * A react component that renders the header for the chat page.
 */
export
function Header(): ReactNode {
  return (
    <div className='px-4 py-2 flex flex-row border-b border-bd-neutral-default'>
      <Private.ChatSelect />
      <Private.ChatSession />
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
    const value = chatConfig.agentId ?? config.agents[0]?.agentId ?? '';

    // Setup the callback to handle the select change.
    const handleValueChange = (value: string) => {
      if (value) {
        chatConfig.update({ agentId: value });
      }
    };

    // Create the items for the selector
    const items = config.agents.map(agent => (
      <SelectItem
        key={ agent.agentId }
        value={ agent.agentId }>
        { agent.agentName }
      </SelectItem>
    ));

    // Return the rendered component.
    return (
      <Select value={ value } onValueChange={ handleValueChange }>
        <SelectTrigger
          size='sm'
          className={ cn(
            'w-[200px] rounded-sm shadow-none focus-visible:ring-0',
            'focus-visible:border-bd-brand-default data-[size=sm]:h-7'
          ) }>
          <SelectValue placeholder='Select...' />
        </SelectTrigger>
        <SelectContent position='popper'>
          { items }
        </SelectContent>
      </Select>
    );
  }

  /**
   * A React component that renders the chat session id.
   */
  export
  function ChatSession(): ReactNode {
    // Fetch the runs from the chat runtime.
    const { runs } = useChatRuntime();

    // Bail if there are no runs.
    if (runs.length === 0) {
      return null;
    }

    // Return the rendered component.
    return (
      <div className='px-4 flex items-center'>
        { runs[0].prompt }
      </div>
    );
  }

  /**
   * A react component that renders a link to create a new chat.
   *
   * This link will retain the currently selected agent.
   */
  export
  function NewChatLink(): ReactNode {
    // Fetch the chat config.
    const { agentId, sessionId } = useChatConfig();

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
        search={ { agentId } }>
        New Chat
      </Link>
    );
  }
}
