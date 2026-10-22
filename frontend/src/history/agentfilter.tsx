/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgents } from '@/context';

/**
 * The select value meaning "no agent filter".
 */
export const ALL_AGENTS = '__all__';

/**
 * A React component that filters the history by agent.
 */
export function AgentFilter(props: AgentFilter.Props): ReactNode {
  const { value, onChange } = props;
  const agents = useAgents();

  const items = [
    { value: ALL_AGENTS, label: 'All agents' },
    ...agents.map((a) => ({
      value: a.id,
      label: a.capabilities.identity?.name || a.id,
    })),
  ];

  const handleValueChange = (next: string | null) => {
    onChange(next ?? ALL_AGENTS);
  };

  return (
    <Select items={items} value={value} onValueChange={handleValueChange}>
      <SelectTrigger aria-label="Filter by agent" className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The namespace for the `AgentFilter` statics.
 */
export namespace AgentFilter {
  /**
   * A type alias for the `AgentFilter` props.
   */
  export type Props = {
    /**
     * The selected agent id, or {@link ALL_AGENTS}.
     */
    readonly value: string;

    /**
     * Called with the new selection.
     */
    readonly onChange: (value: string) => void;
  };
}
