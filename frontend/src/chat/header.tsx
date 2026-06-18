/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useNavigate } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAgents, useChatConfig } from '@/context';

import { cn } from '@/lib/utils';

/**
 * A react component that renders the header for the chat page.
 */
export function Header(): ReactNode {
  return (
    <div className="px-4 py-2 flex flex-row border-b border-bd-neutral-default">
      <Private.AgentSelect />
      <Private.ThreadName />
      <div className="grow" />
      <Private.NewChatLink />
    </div>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the agent selector.
   */
  export function AgentSelect(): ReactNode {
    // Fetch the agents.
    const agents = useAgents();

    // Fetch the thread id setter from the chat config.
    const { agentId } = useChatConfig();

    // Fetch the route navigator.
    const navigate = useNavigate();

    // Create the callback for the value change.
    const handleValueChange = (value: string) => {
      navigate({ to: '.', search: { agentId: value } });
    };

    // Create the items for the selector
    const items = agents.map((agent) => {
      const agentName = agent.capabilities.identity?.name ?? agent.id;
      return (
        <SelectItem key={agent.id} value={agent.id}>
          {agentName}
        </SelectItem>
      );
    });

    // Return the rendered component.
    return (
      <Select value={agentId} onValueChange={handleValueChange}>
        <SelectTrigger
          size="sm"
          className={cn(
            'w-[200px] rounded-sm shadow-none focus-visible:ring-0',
            'focus-visible:border-bd-brand-default data-[size=sm]:h-7',
          )}
        >
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent position="popper">{items}</SelectContent>
      </Select>
    );
  }

  /**
   * A React component that renders the thread name.
   */
  export function ThreadName(): ReactNode {
    // Fetch the current thread.
    const { thread } = useChatConfig();

    // Bail if there is no current thread.
    if (!thread) {
      return null;
    }

    // Return the rendered component.
    return <div className="px-4 flex items-center">{thread.name}</div>;
  }

  /**
   * A react component that renders a link to create a new chat.
   *
   * The current agent id is maintained, everything else is cleared.
   */
  export function NewChatLink(): ReactNode {
    // Fetch the current thread.
    const { thread } = useChatConfig();

    // Determine whether the link should be disabled.
    const isDisabled = thread === null;

    // Return the rendered component.
    return (
      <Link
        to="."
        search={(prev) => ({ agentId: prev.agentId })}
        className={cn(
          'h-7 w-24 flex justify-center items-center rounded-sm text-white',
          isDisabled ? 'bg-bd-brand-default/50' : 'bg-bd-brand-default',
        )}
        disabled={isDisabled}
      >
        New Chat
      </Link>
    );
  }
}
