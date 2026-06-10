/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { atom } from 'jotai';

import type { PendingApproval } from '@/chat/tools/requestapproval';

/**
 * The list of pending human-in-the-loop approval requests.
 *
 * Each request is scoped to its thread via `threadId`. The list is replaced
 * (never mutated) on every change. It is written from outside React by the
 * `request_user_approval` tool handler (which runs in the run loop, not a
 * component) and read in React by `usePendingApprovals`. This state is
 * in-memory only and resets on reload.
 */
export const pendingApprovalsAtom = atom<readonly PendingApproval[]>([]);
