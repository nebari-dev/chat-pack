/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Collapsible } from '@base-ui/react/collapsible';

import { ChevronDown } from 'lucide-react';

import type { ReactNode } from 'react';

/**
 * A React component that renders one collapsible step under a reply, such as
 * the agent's reasoning or the tools it called.
 *
 * Built on Base UI's Collapsible rather than the registry Accordion, because
 * a step is not a section heading and should not add one to the outline.
 */
export function Step(props: Step.Props): ReactNode {
  const { icon, label, defaultOpen = false, children } = props;
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <Collapsible.Trigger className="group/step flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-muted-foreground-strong text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className="group-data-[panel-open]/step:rotate-180 motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-standard)"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="border-border border-t">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

/**
 * The namespace for the `Step` statics.
 */
export namespace Step {
  /**
   * A type alias for the `Step` props.
   */
  export type Props = {
    /**
     * The leading icon.
     */
    readonly icon: ReactNode;

    /**
     * The summary label shown on the trigger.
     */
    readonly label: ReactNode;

    /**
     * Whether the step starts expanded.
     */
    readonly defaultOpen?: boolean;

    /**
     * The expanded content.
     */
    readonly children: ReactNode;
  };
}
