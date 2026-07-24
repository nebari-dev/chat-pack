/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import { sanitizeUrl } from './index';

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
