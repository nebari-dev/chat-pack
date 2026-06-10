/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { getDefaultStore, useAtomValue } from 'jotai';

import { useMemo } from 'react';

import type { JSONValue } from '@/lib/json';

import { pendingApprovalsAtom } from '@/store';

import type { FrontendTool } from './types';

/**
 * The decision a human can make on an approval request.
 */
export type ApprovalDecision = 'approved' | 'rejected';

/**
 * A pending human-in-the-loop approval request awaiting a decision.
 *
 * #### Notes
 * Only the display fields are kept in the atom so its value stays JSON-like.
 * The promise resolver is held separately in `resolvers`, keyed by `id`, and
 * is never exposed to the UI.
 */
export type PendingApproval = {
  /**
   * The unique id of the request, used to resolve it.
   */
  readonly id: string;

  /**
   * The id of the thread the request belongs to.
   *
   * Requests are scoped to their thread so the approval card only appears
   * while viewing the thread that triggered it, not after navigating away.
   */
  readonly threadId: string;

  /**
   * A concise summary of the action the agent wants to take.
   */
  readonly action: string;

  /**
   * Optional additional context explaining the action.
   */
  readonly details?: string;
};

/**
 * The result returned to the agent once a request is decided.
 */
type ApprovalResult = {
  readonly decision: ApprovalDecision;
};

/**
 * The default Jotai store, used to read and write the atom outside React.
 */
const store = getDefaultStore();

/**
 * The promise resolvers for pending requests, keyed by request id.
 *
 * Kept out of the atom so its value stays serializable: the atom holds only
 * the display fields, while the live promise resolver lives here.
 */
const resolvers = new Map<string, (result: ApprovalResult) => void>();

/**
 * Resolve a pending approval request with the human's decision.
 *
 * This removes the request from the pending list, resolves the promise the
 * tool handler is awaiting, and notifies subscribers. It is a no-op if the
 * request id is unknown (e.g. already decided).
 *
 * @param id - The id of the request to resolve.
 *
 * @param decision - The human's decision.
 */
export function decideApproval(id: string, decision: ApprovalDecision): void {
  // Look up the resolver; bail if the request is already gone.
  const resolve = resolvers.get(id);
  if (!resolve) {
    return;
  }

  // Drop the request from both the resolver map and the pending list.
  resolvers.delete(id);
  store.set(
    pendingApprovalsAtom,
    store.get(pendingApprovalsAtom).filter((req) => req.id !== id),
  );

  // Resolve the handler's promise. Jotai notifies subscribers of the write.
  resolve({ decision });
}

/**
 * A hook returning the pending approval requests for a given thread.
 *
 * Requests are scoped to the thread that triggered them, so navigating to a
 * different thread (or a new, unsaved chat) hides cards that belong to the
 * thread left behind. The component re-renders whenever a request is added
 * or decided.
 *
 * @param threadId - The id of the thread to show requests for. When
 *   `undefined` (e.g. an unsaved new chat), no requests are returned.
 *
 * @returns The pending approval requests for the thread, in request order.
 */
export function usePendingApprovals(
  threadId: string | undefined,
): readonly PendingApproval[] {
  const all = useAtomValue(pendingApprovalsAtom);
  return useMemo(
    () => all.filter((req) => req.threadId === threadId),
    [all, threadId],
  );
}

/**
 * A frontend tool that asks a human to approve or reject a proposed action.
 *
 * #### Notes
 * This is a human-in-the-loop gate. When the agent calls it, the handler
 * registers a pending request and returns a promise that does not resolve
 * until the user approves or rejects it in the UI. The frontend tool loop
 * awaits that promise, so the run pauses on the human until they decide. The
 * decision is returned to the agent so it can proceed or change course.
 */
export const requestApprovalTool: FrontendTool = {
  definition: {
    name: 'request_user_approval',
    description:
      'Get the user to approve an action before you take it. Before taking ' +
      'ANY action that changes state, sends or deletes data, writes files, ' +
      'spends money, or affects anything outside this conversation, call ' +
      'this tool first and wait for approval. When in doubt, ask rather than ' +
      'proceed; prefer calling this tool over acting silently. The run ' +
      "pauses until the user decides. The result is { decision: 'approved' " +
      "| 'rejected' }; if rejected, do not take the action.",
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description:
            'A concise, specific summary of the action you want to take, ' +
            'phrased so the user can decide at a glance.',
        },
        details: {
          type: 'string',
          description:
            'Optional additional context, consequences, or specifics the ' +
            'user should weigh before deciding.',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },

  // Start disabled; the user opts in via the tools panel.
  defaultEnabled: false,

  handler: (args, context): Promise<JSONValue> => {
    // Normalize the arguments provided by the agent.
    const action = typeof args.action === 'string' ? args.action.trim() : '';
    const details =
      typeof args.details === 'string' && args.details.trim()
        ? args.details.trim()
        : undefined;

    // Reject malformed calls with a structured error the agent can react to.
    if (!action) {
      return Promise.resolve({
        error: 'An "action" describing what to approve is required.',
      });
    }

    // Register the request and wait for the human to decide.
    return new Promise<JSONValue>((resolve) => {
      const id = crypto.randomUUID();
      resolvers.set(id, resolve);
      store.set(pendingApprovalsAtom, [
        ...store.get(pendingApprovalsAtom),
        { id, threadId: context.threadId, action, details },
      ]);
    });
  },
};
