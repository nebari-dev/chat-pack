/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { atom } from 'jotai';

/**
 * The set of disabled frontend tool names.
 *
 * A tool is enabled unless its name appears in this set. The set is replaced
 * (never mutated) on every change. It is seeded by the tool registry with the
 * tools that declare `defaultEnabled: false`. This state is in-memory only and
 * resets on reload.
 */
export const disabledToolsAtom = atom<ReadonlySet<string>>(new Set<string>());
