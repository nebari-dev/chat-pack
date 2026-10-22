/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Sparkles } from 'lucide-react';

import type { ReactNode } from 'react';

import { MarkdownRenderer } from '@/components/markdown/markdownrenderer';

import { Step } from './step';

/**
 * A React component that renders the agent's reasoning as a collapsed step,
 * readable in place instead of in a side panel.
 */
export function ReasoningStep(props: ReasoningStep.Props): ReactNode {
  const { message } = props;
  return (
    <Step icon={<Sparkles />} label="Reasoning">
      <div className="px-3 py-1 text-muted-foreground-strong text-sm">
        <MarkdownRenderer content={message.content} />
      </div>
    </Step>
  );
}

/**
 * The namespace for the `ReasoningStep` statics.
 */
export namespace ReasoningStep {
  /**
   * A type alias for the `ReasoningStep` props.
   */
  export type Props = {
    /**
     * The reasoning message to render.
     */
    readonly message: agui.ReasoningMessage;
  };
}
