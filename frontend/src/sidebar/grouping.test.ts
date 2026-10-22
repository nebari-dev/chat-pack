/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { groupByRecency } from './grouping';

// A fixed local "now" so the buckets are deterministic.
const NOW = new Date(2026, 9, 21, 15, 0, 0);

// Build an ISO timestamp `days` calendar days before NOW, at `hour` local.
const daysAgo = (days: number, hour = 12) =>
  new Date(2026, 9, 21 - days, hour, 0, 0).toISOString();

const byTs = (x: { ts: string }) => x.ts;

describe('groupByRecency', () => {
  it('buckets items by calendar day and drops empty groups', () => {
    const items = [
      { id: 'a', ts: daysAgo(0) },
      { id: 'b', ts: daysAgo(1) },
      { id: 'c', ts: daysAgo(5) },
      { id: 'd', ts: daysAgo(45) },
    ];
    const groups = groupByRecency(items, byTs, NOW);
    expect(groups.map((g) => g.label)).toEqual([
      'Today',
      'Yesterday',
      'Previous 7 days',
      'Older',
    ]);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([
      ['a'],
      ['b'],
      ['c'],
      ['d'],
    ]);
  });

  it('uses calendar days, not 24-hour windows', () => {
    // 11pm yesterday is less than 24 hours before 3pm today.
    const groups = groupByRecency([{ ts: daysAgo(1, 23) }], byTs, NOW);
    expect(groups[0].label).toBe('Yesterday');
  });

  it('sorts newest first within a group', () => {
    const items = [
      { id: 'old', ts: daysAgo(0, 8) },
      { id: 'new', ts: daysAgo(0, 14) },
    ];
    const [today] = groupByRecency(items, byTs, NOW);
    expect(today.items.map((i) => i.id)).toEqual(['new', 'old']);
  });

  it('treats future timestamps as today', () => {
    const groups = groupByRecency([{ ts: daysAgo(-2) }], byTs, NOW);
    expect(groups[0].label).toBe('Today');
  });

  it('returns no groups for no items', () => {
    expect(groupByRecency([], byTs, NOW)).toEqual([]);
  });
});
