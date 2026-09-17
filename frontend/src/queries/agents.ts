/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import * as api from '@/api';

/**
 * Invalidate the agent list so every consumer refetches.
 *
 * The authenticated route loader also holds a copy in context, so callers
 * must additionally `router.invalidate()` after the mutation settles.
 */
const invalidateAgents = (client: QueryClient) => {
  return client.invalidateQueries({ queryKey: ['/api/agents'] });
};

/**
 * A mutation for registering a new dynamic agent.
 */
export const createAgentMutation = mutationOptions({
  mutationFn: (options: createAgentMutation.Options) => {
    return api.createAgent(options.id, options.definition);
  },
  onSuccess: (_, __, ___, context) => {
    invalidateAgents(context.client);
  },
});

/**
 * The namespace for the `createAgentMutation` statics.
 */
export namespace createAgentMutation {
  /**
   * A type alias for the mutation variables.
   */
  export type Options = {
    /**
     * The client-generated agent id.
     */
    readonly id: string;

    /**
     * The validated agent definition.
     */
    readonly definition: api.AgentDefinition;
  };
}

/**
 * A mutation for deleting a dynamic agent.
 */
export const deleteAgentMutation = mutationOptions({
  mutationFn: (id: string) => {
    return api.deleteAgent(id);
  },
  onSuccess: (_, __, ___, context) => {
    invalidateAgents(context.client);
  },
});

/**
 * A mutation for replacing a dynamic agent's definition.
 *
 * Ravnar has no update endpoint, so an edit is a delete followed by a
 * re-registration under the same id (which keeps existing threads bound).
 * This is not atomic: if the re-registration is rejected, the previous
 * definition is restored on a best-effort basis before the error propagates.
 */
export const replaceAgentMutation = mutationOptions({
  mutationFn: async (options: replaceAgentMutation.Options) => {
    const { id, definition, previous } = options;
    await api.deleteAgent(id);
    try {
      return await api.createAgent(id, definition);
    } catch (error) {
      try {
        await api.createAgent(id, previous);
      } catch (rollbackError) {
        console.error('Failed to restore agent after a rejected edit', {
          id,
          rollbackError,
        });
      }
      throw error;
    }
  },
  onSettled: (_, __, ___, ____, context) => {
    invalidateAgents(context.client);
  },
});

/**
 * The namespace for the `replaceAgentMutation` statics.
 */
export namespace replaceAgentMutation {
  /**
   * A type alias for the mutation variables.
   */
  export type Options = {
    /**
     * The id of the agent being edited.
     */
    readonly id: string;

    /**
     * The new, validated agent definition.
     */
    readonly definition: api.AgentDefinition;

    /**
     * The definition to restore if the new one is rejected.
     */
    readonly previous: api.AgentDefinition;
  };
}
