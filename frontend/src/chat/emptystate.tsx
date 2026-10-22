/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { MessageSquare, Wrench } from 'lucide-react';

import type { ReactNode } from 'react';

import { useState } from 'react';

import type * as api from '@/api';
import { Avatar, AvatarFallback, getInitials } from '@/components/avatar';
import { Badge } from '@/components/ui/badge';
import { useAgents, useChatConfig } from '@/context';
import { notifyError } from '@/lib/notifications';

import { useOnSubmit } from './hooks';

/**
 * The number of tool badges shown before collapsing the rest into "+N more".
 */
const MAX_TOOL_BADGES = 4;

/**
 * A React component that renders the new-chat empty state.
 *
 * It introduces the agent (name, description, tools) and offers its quick
 * prompts, which the API has always returned but the UI never showed.
 */
export function EmptyState(): ReactNode {
  const agents = useAgents();
  const { agentId } = useChatConfig();
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return <div className="grow" />;
  }

  const name = agent.capabilities.identity?.name || agent.id;
  const description = agent.capabilities.identity?.description;

  return (
    <section
      aria-label={`New chat with ${name}`}
      className="mx-auto flex w-full max-w-(--thread-max-width) grow flex-col justify-center gap-6 py-8 motion-safe:animate-fade-in"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-14 rounded-2xl">
          <AvatarFallback className="rounded-2xl font-semibold text-xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-balance font-semibold text-2xl tracking-tight">
          {name}
        </h1>
        {description ? (
          <p className="max-w-prose text-balance text-muted-foreground">
            {description}
          </p>
        ) : null}
        <ToolBadges tools={agent.capabilities.tools?.items ?? []} />
      </div>
      <QuickPrompts prompts={agent.quickPrompts} />
    </section>
  );
}

/**
 * A React component that renders the agent's tools as badges.
 */
function ToolBadges(props: { readonly tools: readonly { name: string }[] }) {
  const { tools } = props;
  if (tools.length === 0) {
    return null;
  }
  const shown = tools.slice(0, MAX_TOOL_BADGES);
  const hidden = tools.length - shown.length;
  return (
    <ul aria-label="Tools" className="flex flex-wrap justify-center gap-1.5">
      {shown.map((tool) => (
        <li key={tool.name}>
          <Badge variant="outline" className="gap-1 font-mono">
            <Wrench className="size-3" aria-hidden="true" />
            {tool.name}
          </Badge>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Badge variant="outline">{`+${hidden} more`}</Badge>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * A React component that renders the agent's quick prompts as cards.
 * Clicking one sends it as the first message.
 */
function QuickPrompts(props: { readonly prompts: readonly api.QuickPrompt[] }) {
  const { prompts } = props;
  const onSubmit = useOnSubmit();

  // Guard against double sends while the thread is being created.
  const [pending, setPending] = useState(false);

  if (prompts.length === 0) {
    return null;
  }

  const send = async (prompt: string) => {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      await onSubmit({ prompt });
    } catch (error) {
      notifyError(error);
    } finally {
      setPending(false);
    }
  };

  const cards = prompts.map((qp) => (
    <li key={qp.title} className="flex">
      <button
        type="button"
        disabled={pending}
        onClick={() => send(qp.prompt)}
        className="flex w-full cursor-pointer flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left outline-none hover:border-border-strong hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60 motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-(--duration-fast) motion-safe:active:scale-[0.98]"
      >
        <MessageSquare
          className="mb-1 size-4 text-primary"
          aria-hidden="true"
        />
        <span className="font-medium text-sm">{qp.title}</span>
        <span className="text-muted-foreground text-xs">
          {qp.description || qp.prompt}
        </span>
      </button>
    </li>
  ));

  return (
    <ul
      aria-label="Suggested prompts"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards}
    </ul>
  );
}
