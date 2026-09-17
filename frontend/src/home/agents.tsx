/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { MessageSquarePlus, Plus } from 'lucide-react';

import type { ReactNode } from 'react';

import * as api from '@/api';

import { Badge } from '@/components/ui/badge';

import { useAgents, useAppConfig, useHasPermission } from '@/context';

import { LinkCard } from './linkcard';

/**
 * A React component that renders the agents cards for the home page.
 */
export function Agents(): ReactNode {
  // Fetch the agents and the authoring gates.
  const agents = useAgents();
  const { dynamicAgentsEnabled } = useAppConfig();
  const canWrite = useHasPermission('agents:write');
  const canCreate = dynamicAgentsEnabled && canWrite;

  // Bail early if there is nothing to show.
  if (agents.length === 0 && !canCreate) {
    return null;
  }

  // Create the cards for the agents.
  const cards = agents.map((agent) => {
    const agentName = agent.capabilities.identity?.name ?? '';
    const badge = api.getDynamicAgent(agent) ? (
      <Badge variant="secondary">Custom</Badge>
    ) : undefined;
    return (
      <LinkCard
        key={agent.id}
        to={`/chat?agentId=${agent.id}`}
        title={agentName}
        description={`Create a new chat with ${agentName}`}
        icon={<MessageSquarePlus size={16} />}
        badge={badge}
      />
    );
  });

  // Offer authoring where it is enabled and permitted.
  if (canCreate) {
    cards.push(
      <LinkCard
        key="new-agent"
        to="/agents?new=true"
        title="New agent"
        description="Create a custom agent with its own instructions"
        icon={<Plus size={16} />}
      />,
    );
  }

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-4">
      <div className="px-1 py-2 font-semibold border-b border-bd-bd-neutral-default">
        Agents
      </div>
      <div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
        {cards}
      </div>
    </div>
  );
}
