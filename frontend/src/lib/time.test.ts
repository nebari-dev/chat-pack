/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './time';

const NOW = new Date('2026-10-21T15:00:00.000Z');

// An ISO timestamp `seconds` before NOW.
const ago = (seconds: number) =>
  new Date(NOW.getTime() - seconds * 1000).toISOString();

describe('formatRelativeTime', () => {
  it('reads "just now" under a minute and for future times', () => {
    expect(formatRelativeTime(ago(30), NOW, 'en')).toBe('just now');
    expect(formatRelativeTime(ago(-120), NOW, 'en')).toBe('just now');
  });

  it('uses the largest whole unit', () => {
    expect(formatRelativeTime(ago(12 * 60), NOW, 'en')).toBe('12 minutes ago');
    expect(formatRelativeTime(ago(2 * 3600), NOW, 'en')).toBe('2 hours ago');
    expect(formatRelativeTime(ago(3 * 86400), NOW, 'en')).toBe('3 days ago');
    expect(formatRelativeTime(ago(400 * 86400), NOW, 'en')).toBe('last year');
  });

  it('uses natural words for one unit', () => {
    expect(formatRelativeTime(ago(86400), NOW, 'en')).toBe('yesterday');
  });
});
