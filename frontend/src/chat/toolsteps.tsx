/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { ChevronRight, Wrench } from 'lucide-react';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { useToolMessage } from './hooks';
import { Step } from './step';

/**
 * A React component that lists the tools a reply called as a collapsible
 * step. Each row opens the call's arguments and result in the detail drawer.
 */
export function ToolSteps(props: ToolSteps.Props): ReactNode {
  const { message } = props;
  const calls = message.toolCalls ?? [];
  if (calls.length === 0) {
    return null;
  }

  const label = `Used ${calls.length} ${calls.length === 1 ? 'tool' : 'tools'}`;
  const rows = calls.map((call) => (
    <ToolRow key={call.id} messageId={message.id} call={call} />
  ));

  return (
    <Step icon={<Wrench />} label={label} defaultOpen>
      <ul className="divide-y divide-border">{rows}</ul>
    </Step>
  );
}

/**
 * The namespace for the `ToolSteps` statics.
 */
export namespace ToolSteps {
  /**
   * A type alias for the `ToolSteps` props.
   */
  export type Props = {
    /**
     * The assistant message whose tool calls to list.
     */
    readonly message: agui.AssistantMessage;
  };
}

/**
 * A React component that renders one tool call row with its status.
 */
function ToolRow(props: {
  readonly messageId: string;
  readonly call: agui.ToolCall;
}): ReactNode {
  const { messageId, call } = props;

  // A call is finished once its tool result message exists.
  const done = useToolMessage(call.id) !== undefined;

  const statusLabel = done ? 'Done' : 'Running';
  return (
    <li>
      <Link
        to="."
        search={(prev) => ({
          ...prev,
          showTools: undefined,
          detailId: messageId,
        })}
        className="flex items-center gap-2.5 px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full',
            done
              ? 'bg-success-foreground'
              : 'bg-primary motion-safe:animate-skeleton-pulse',
          )}
        />
        <span className="font-mono text-xs">{call.function.name}</span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground text-xs">
          {call.function.arguments}
        </span>
        <span className="sr-only">{statusLabel}</span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  );
}
