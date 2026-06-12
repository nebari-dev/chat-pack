/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { Hammer, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';

import { Switch } from '@/components/ui/switch';

import { useAgents, useChatConfig } from '@/context';

import { cn } from '@/lib/utils';

/**
 * A react component that renders the tools panel for the chat sidebar.
 *
 * The panel shows the tools the current agent can use. Tools are provided
 * by the agent and always active.
 */
export function ToolsPanel(): ReactNode {
  // Fetch the agents and the current agent id from the chat config.
  const agents = useAgents();
  const { agentId } = useChatConfig();

  // Resolve the current agent.
  const agent = agents.find((a) => a.id === agentId);

  // Extract the tools provided by the agent.
  const items = agent?.capabilities?.tools?.items ?? [];

  // Return the rendered component.
  return (
    <section className="h-full flex flex-col">
      <h1 className="p-2 flex flex-row justify-between items-center">
        <span className="text-xl font-bold">Tools</span>
        <Link to="." search={(prev) => ({ ...prev, showTools: undefined })}>
          <X />
        </Link>
      </h1>
      <Separator />
      <div className="p-2 grow overflow-auto flex flex-col gap-4">
        <Private.ToolList tools={items} />
      </div>
    </section>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders the agent tools as uniform cards.
   *
   * Every card is the same size. Tools are always active, so each switch is
   * shown on and disabled.
   */
  export function ToolList(props: { tools: agui.Tool[] }): ReactNode {
    // Extract the props.
    const { tools } = props;

    // Render an empty state when the agent provides no tools.
    if (tools.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          This agent does not provide any tools.
        </p>
      );
    }

    // Return the rendered component.
    return (
      <ul className="flex flex-col gap-2">
        {tools.map((tool) => (
          <li
            key={tool.name}
            className={cn(
              'h-12 overflow-hidden rounded-sm px-2',
              'border border-bd-neutral-default',
              'flex flex-row items-center justify-between gap-2',
            )}
          >
            <div className="min-w-0 flex flex-col">
              <div className="min-w-0 flex flex-row items-center gap-1.5">
                <Hammer size={12} className="shrink-0" />
                <span className="font-mono text-xs truncate">{tool.name}</span>
              </div>
              {tool.description ? (
                <p className="text-xs text-muted-foreground truncate">
                  {tool.description}
                </p>
              ) : null}
            </div>
            <Switch
              aria-label={`Toggle ${tool.name}`}
              size="sm"
              checked
              disabled
              className="shrink-0"
            />
          </li>
        ))}
      </ul>
    );
  }
}
