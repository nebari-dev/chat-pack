/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockCopyButton,
  CodeBlockHeader,
} from '@/components/ui/code-block';

import { useToolMessage } from './hooks';

/**
 * A React component that renders every tool call of a reply with its full
 * arguments and result, for the detail drawer.
 */
export function ToolDetail(props: ToolDetail.Props): ReactNode {
  const { message } = props;
  const calls = (message.toolCalls ?? []).map((call) => (
    <ToolCallDetail key={call.id} call={call} />
  ));
  return <div className="flex min-w-0 flex-col gap-6">{calls}</div>;
}

/**
 * The namespace for the `ToolDetail` statics.
 */
export namespace ToolDetail {
  /**
   * A type alias for the `ToolDetail` props.
   */
  export type Props = {
    /**
     * The assistant message whose tool calls to show.
     */
    readonly message: agui.AssistantMessage;
  };
}

/**
 * Pretty-print a JSON string, or return it unchanged if it is not JSON.
 */
function formatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/**
 * A React component that renders one tool call's arguments and result.
 */
function ToolCallDetail(props: { readonly call: agui.ToolCall }): ReactNode {
  const { call } = props;
  const result = useToolMessage(call.id);

  const status = result ? (
    <Badge variant="secondary" className="bg-success text-success-foreground">
      Done
    </Badge>
  ) : (
    <Badge variant="secondary">Running</Badge>
  );

  const resultBlock = result ? (
    <Payload label="Result" code={formatJson(result.content)} />
  ) : (
    <p className="text-muted-foreground text-sm">Waiting for the result…</p>
  );

  return (
    <section
      aria-label={`Tool call ${call.function.name}`}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 truncate font-medium font-mono text-sm">
          {call.function.name}
        </h3>
        {status}
      </div>
      <Payload label="Arguments" code={formatJson(call.function.arguments)} />
      {resultBlock}
    </section>
  );
}

/**
 * A React component that renders a labelled, copyable JSON payload.
 */
function Payload(props: { readonly label: string; readonly code: string }) {
  const { label, code } = props;
  return (
    <CodeBlock code={code} showCopyButton={false} className="w-full min-w-0">
      <CodeBlockHeader>
        <span>{label}</span>
        <CodeBlockCopyButton />
      </CodeBlockHeader>
      <CodeBlockBody maxLines={16} aria-label={label} />
    </CodeBlock>
  );
}
