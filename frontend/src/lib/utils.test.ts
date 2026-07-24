/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values from conditional classes', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('merges conflicting tailwind utilities, last one winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('resolves array and object class inputs', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });
});
