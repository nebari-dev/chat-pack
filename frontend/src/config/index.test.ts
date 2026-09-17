/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { sanitizeAgentAuthoring, sanitizeUrl } from './index';

describe('sanitizeUrl', () => {
  it('preserves root-relative paths', () => {
    expect(sanitizeUrl('/logo.svg')).toBe('/logo.svg');
  });

  it('preserves http(s) URLs', () => {
    expect(sanitizeUrl('https://example.com/logo.png')).toBe(
      'https://example.com/logo.png',
    );
    expect(sanitizeUrl('http://example.com/logo.png')).toBe(
      'http://example.com/logo.png',
    );
  });

  it('preserves base64-encoded image data URIs', () => {
    expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(sanitizeUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe(
      'data:image/svg+xml;base64,PHN2Zy8+',
    );
  });

  it('drops javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('drops data:text/html URIs', () => {
    expect(
      sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='),
    ).toBeUndefined();
  });

  it('drops non-base64 image data URIs', () => {
    expect(
      sanitizeUrl('data:image/svg+xml,<svg onload=alert(1)></svg>'),
    ).toBeUndefined();
  });

  it('drops base64 data URIs whose MIME type is not an allowed image', () => {
    expect(
      sanitizeUrl('data:application/javascript;base64,YWxlcnQoMSk='),
    ).toBeUndefined();
  });

  it('drops empty and malformed values', () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
    expect(sanitizeUrl('')).toBeUndefined();
    expect(sanitizeUrl('not a url')).toBeUndefined();
  });
});

describe('sanitizeAgentAuthoring', () => {
  const EMPTY = {
    models: [],
    tools: [],
    mcpServers: [],
    databases: [],
    mcpEnabled: false,
  };

  it('returns empty defaults for missing or malformed input', () => {
    expect(sanitizeAgentAuthoring(undefined)).toEqual(EMPTY);
    expect(sanitizeAgentAuthoring('nope')).toEqual(EMPTY);
    expect(sanitizeAgentAuthoring({ models: 'nope', tools: 'nope' })).toEqual(
      EMPTY,
    );
  });

  it('sanitizes catalog entries', () => {
    const resolved = sanitizeAgentAuthoring({
      tools: [
        { id: 'charts', label: 'Charts', kind: 'visualization' },
        { id: 'permits', kind: 'sql', description: ' Permits ' },
        { id: 'no-kind', label: 'x' },
        { id: 'Bad Id', label: 'x', kind: 'sql' },
        { id: 'charts', label: 'dupe', kind: 'sql' },
      ],
      mcpServers: [
        { id: 'frames', label: 'Frames', auth: 'impersonate' },
        { id: 'plain', label: 'Plain', auth: 'bogus' },
      ],
      databases: [{ id: 'permits', label: 'Permits' }, 42],
    });
    expect(resolved.tools).toEqual([
      { id: 'charts', label: 'Charts', kind: 'visualization' },
      { id: 'permits', label: 'permits', kind: 'sql', description: 'Permits' },
    ]);
    expect(resolved.mcpServers).toEqual([
      { id: 'frames', label: 'Frames', auth: 'impersonate' },
      { id: 'plain', label: 'Plain', auth: 'none' },
    ]);
    expect(resolved.databases).toEqual([{ id: 'permits', label: 'Permits' }]);
  });

  it('keeps well-formed models and trims labels', () => {
    expect(
      sanitizeAgentAuthoring({
        models: [
          { id: 'anthropic/claude-sonnet-4.6', label: '  Claude  ' },
          { id: 'openai/gpt-5.5' },
        ],
      }).models,
    ).toEqual([
      { id: 'anthropic/claude-sonnet-4.6', label: 'Claude' },
      { id: 'openai/gpt-5.5' },
    ]);
  });

  it('drops malformed ids, duplicates, and non-string labels', () => {
    expect(
      sanitizeAgentAuthoring({
        models: [
          { id: 'a/b', label: 42 },
          { id: 'a/b', label: 'dupe' },
          { id: 'has spaces' },
          { id: '' },
          { label: 'no id' },
          null,
        ],
      }).models,
    ).toEqual([{ id: 'a/b' }]);
  });

  it('only enables MCP on an explicit true', () => {
    expect(sanitizeAgentAuthoring({ mcp: { enabled: true } }).mcpEnabled).toBe(
      true,
    );
    expect(sanitizeAgentAuthoring({ mcp: { enabled: 'yes' } }).mcpEnabled).toBe(
      false,
    );
    expect(sanitizeAgentAuthoring({}).mcpEnabled).toBe(false);
  });
});
