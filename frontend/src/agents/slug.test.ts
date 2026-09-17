/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { AGENT_ID_PATTERN } from '@/api';

import { makeAgentId, slugify } from './slug';

describe('slugify', () => {
  it('lowercases and dashes non-alphanumerics', () => {
    expect(slugify('  Support Bot! v2 ')).toBe('support-bot-v2');
  });

  it('strips diacritics', () => {
    expect(slugify('Café Ménagerie')).toBe('cafe-menagerie');
  });

  it('falls back to "agent" when nothing survives', () => {
    expect(slugify('日本語')).toBe('agent');
    expect(slugify('---')).toBe('agent');
  });

  it('truncates long names without a trailing dash', () => {
    const slug = slugify(`${'word '.repeat(20)}`);
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('makeAgentId', () => {
  it('produces ids matching the backend pattern', () => {
    for (const name of ['Support Bot', 'x', '日本語', 'a'.repeat(100)]) {
      const id = makeAgentId(name);
      expect(id).toMatch(AGENT_ID_PATTERN);
      expect(id).toMatch(/-[a-z0-9]{6}$/);
    }
  });

  it('differs between calls for the same name', () => {
    expect(makeAgentId('Bot')).not.toBe(makeAgentId('Bot'));
  });
});
