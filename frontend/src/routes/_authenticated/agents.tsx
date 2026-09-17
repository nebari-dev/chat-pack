/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';

import { useCallback } from 'react';

import * as z from 'zod';

import { AgentsPage, makeAgentId } from '@/agents';

import type * as api from '@/api';

import { getAgentAuthoringConfig } from '@/config';

import type { AgentsConfig } from '@/context';

import { AgentsConfigContext, useHasPermission } from '@/context';

import {
  appConfigQuery,
  createAgentMutation,
  deleteAgentMutation,
  replaceAgentMutation,
} from '@/queries';

// The schema for the `/agents` route search params.
//
// The authoring dialog's open state lives in the URL: `?new=true` opens the
// create form and `?edit=<id>` opens the edit form for a dynamic agent.
const searchSchema = z.object({
  new: z.boolean().optional(),
  edit: z.string().optional(),
});

/**
 * The route for the `/agents` endpoint.
 */
export const Route = createFileRoute('/_authenticated/agents')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    // The page only exists when the backend accepts dynamic agents.
    const appConfig = await context.client.fetchQuery(appConfigQuery);
    if (!appConfig.dynamicAgentsEnabled) {
      throw redirect({ to: '/', replace: true });
    }
  },
  component: RouteComponent,
});

/**
 * The component that renders the `/agents` route.
 */
function RouteComponent() {
  // Fetch the router for the current endpoint.
  const router = useRouter();

  // Get the mutations for managing agents.
  const { mutateAsync: createAsync } = useMutation(createAgentMutation);
  const { mutateAsync: replaceAsync } = useMutation(replaceAgentMutation);
  const { mutateAsync: deleteAsync } = useMutation(deleteAgentMutation);

  // Resolve the permission gates and the deploy-time authoring options.
  const canWrite = useHasPermission('agents:write');
  const canDelete = useHasPermission('agents:delete');
  const { models, mcpEnabled } = getAgentAuthoringConfig();

  // Create the handler for registering a new agent.
  //
  // The agent list is loaded by the authenticated route's loader and pushed
  // through context, so after each mutation the router is reloaded to refresh
  // the picker, the home page, and this table.
  const createAgent = useCallback(
    async (definition: api.AgentDefinition) => {
      const id = makeAgentId(definition.name);
      const agent = await createAsync({ id, definition });
      await router.invalidate();
      return agent;
    },
    [createAsync, router],
  );

  // Create the handler for replacing an existing agent's definition.
  const replaceAgent = useCallback(
    async (agent: api.DynamicAgent, definition: api.AgentDefinition) => {
      const result = await replaceAsync({
        id: agent.id,
        definition,
        previous: agent.definition,
      });
      await router.invalidate();
      return result;
    },
    [replaceAsync, router],
  );

  // Create the handler for deleting an agent.
  const deleteAgent = useCallback(
    async (id: string) => {
      await deleteAsync(id);
      await router.invalidate();
    },
    [deleteAsync, router],
  );

  // Create the agents config.
  const config: AgentsConfig = {
    models,
    mcpEnabled,
    canWrite,
    canDelete,
    createAgent,
    replaceAgent,
    deleteAgent,
  };

  // Return the rendered component.
  return (
    <AgentsConfigContext value={config}>
      <AgentsPage />
    </AgentsConfigContext>
  );
}
