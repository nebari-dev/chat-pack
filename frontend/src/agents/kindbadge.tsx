/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import * as api from '@/api';

import { Badge } from '@/components/ui/badge';

/**
 * A React component that labels an agent as user-authored or config-declared.
 */
export function AgentKindBadge(props: AgentKindBadge.Props): ReactNode {
  // Extract the props.
  const { agent } = props;

  // Return the rendered component.
  return api.getDynamicAgent(agent) ? (
    <Badge variant="secondary">Custom</Badge>
  ) : (
    <Badge variant="outline">Static</Badge>
  );
}

/**
 * The namespace for the `AgentKindBadge` statics.
 */
export namespace AgentKindBadge {
  /**
   * A type alias for the `AgentKindBadge` props.
   */
  export type Props = {
    /**
     * The agent to label.
     */
    readonly agent: api.AgentConfig;
  };
}
