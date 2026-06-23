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

import { setToolEnabled, useFrontendToolStates } from './tools';

/**
 * A react component that renders the tools panel for the chat sidebar.
 *
 * The panel shows two groups of tools: the tools provided by the current
 * agent (always active), and the client-executed frontend tools, which can
 * be toggled on and off per browser.
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
        <Private.Group label="Agent" className="pb-2">
          <Private.AgentToolList tools={items} />
        </Private.Group>
        <Private.Group label="Client">
          <Private.FrontendToolList />
        </Private.Group>
      </div>
    </section>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders a labeled group of tools.
   */
  export function Group(props: {
    label: string;
    children: ReactNode;
    className?: string;
  }): ReactNode {
    return (
      <div className={cn('flex flex-col gap-2', props.className)}>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {props.label}
        </span>
        {props.children}
      </div>
    );
  }

  /**
   * A react component that renders a single tool as a uniform card.
   *
   * The trailing `control` slot holds the tool's switch, which the caller
   * wires up as active or always-on depending on the kind of tool.
   */
  export function ToolCard(props: {
    name: string;
    description?: string;
    control: ReactNode;
  }): ReactNode {
    const { name, description, control } = props;
    return (
      <li
        className={cn(
          'h-12 overflow-hidden rounded-sm px-2',
          'border border-bd-neutral-default',
          'flex flex-row items-center justify-between gap-2',
        )}
      >
        <div className="min-w-0 flex flex-col">
          <div className="min-w-0 flex flex-row items-center gap-1.5">
            <Hammer size={12} className="shrink-0" />
            <span className="font-mono text-xs truncate">{name}</span>
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          ) : null}
        </div>
        {control}
      </li>
    );
  }

  /**
   * A react component that renders the agent tools as uniform cards.
   *
   * Agent tools are provided by the server and always active, so each switch
   * is shown on and disabled.
   */
  export function AgentToolList(props: { tools: agui.Tool[] }): ReactNode {
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
          <ToolCard
            key={tool.name}
            name={tool.name}
            description={tool.description}
            control={
              <Switch
                aria-label={`Toggle ${tool.name}`}
                size="sm"
                checked
                disabled
                className="shrink-0"
              />
            }
          />
        ))}
      </ul>
    );
  }

  /**
   * A react component that renders the client-executed frontend tools.
   *
   * Each tool has a live switch that enables or disables whether the tool is
   * advertised to the agent on the next run.
   */
  export function FrontendToolList(): ReactNode {
    // Fetch the frontend tools paired with their enablement state.
    const states = useFrontendToolStates();

    // Render an empty state when no frontend tools are registered.
    if (states.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No client tools are available.
        </p>
      );
    }

    // Return the rendered component.
    return (
      <ul className="flex flex-col gap-2">
        {states.map(({ tool, enabled }) => {
          const { name, description } = tool.definition;
          return (
            <ToolCard
              key={name}
              name={name}
              description={description}
              control={
                <Switch
                  aria-label={`Toggle ${name}`}
                  size="sm"
                  checked={enabled}
                  onCheckedChange={(value) => setToolEnabled(name, value)}
                  className="shrink-0"
                />
              }
            />
          );
        })}
      </ul>
    );
  }
}
