/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { getAgentInitials, getInitials } from './avatar';

describe('getInitials', () => {
  it('uses the first and last word of a person name', () => {
    expect(getInitials('Mary Ann Smith')).toBe('MS');
  });

  it('falls back to the email', () => {
    expect(getInitials('', 'jane@example.com')).toBe('JA');
  });
});

describe('getAgentInitials', () => {
  it('uses the first two words', () => {
    expect(getAgentInitials('Claude Sonnet 5.5')).toBe('CS');
    expect(getAgentInitials('Austin Permits')).toBe('AP');
  });

  it('uses the first two letters of a single word', () => {
    expect(getAgentInitials('assistant')).toBe('AS');
  });

  it('handles an empty name', () => {
    expect(getAgentInitials('  ')).toBe('?');
  });
});
