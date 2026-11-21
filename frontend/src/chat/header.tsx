/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useNavigate } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAgents, useChatConfig } from '@/context';

/**
 * A react component that renders the header for the chat page.
 */
export function Header(): ReactNode {
  return (
    <div className="px-4 py-2 flex flex-row border-b border-border">
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
    const handleValueChange = (value: string | null) => {
      if (value !== null) {
        navigate({ to: '.', search: { agentId: value } });
      }
    };

    // Map each agent id to its display name. Base UI's `SelectValue` renders
    // the raw value unless the root is given the labels up front.
    const labels = Object.fromEntries(
      agents.map((agent) => [
        agent.id,
        agent.capabilities.identity?.name ?? agent.id,
      ]),
    );

    // Create the items for the selector
    const items = agents.map((agent) => (
      <SelectItem key={agent.id} value={agent.id}>
        {labels[agent.id]}
      </SelectItem>
    ));

    // Return the rendered component.
    return (
      <Select value={agentId} items={labels} onValueChange={handleValueChange}>
        <SelectTrigger
          aria-label="Select agent"
          className="h-7 min-h-7 w-[200px] py-0"
        >
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>{items}</SelectContent>
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
    return (
      <div className="px-4 min-w-0 flex items-center">
        <span className="truncate">{thread.name}</span>
      </div>
    );
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

    // Create the link the button renders as.
    const link = <Link to="." search={(prev) => ({ agentId: prev.agentId })} />;

    // Return the rendered component.
    return (
      <Button size="sm" className="w-24" disabled={isDisabled} render={link}>
        New Chat
      </Button>
    );
  }
}
