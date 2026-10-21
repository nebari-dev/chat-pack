/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * Runtime application configuration.
 *
 * The frontend fetches `/config.json` once at startup, before React mounts, so
 * that Keycloak connection settings and branding can be changed without
 * rebuilding the image. In a Kubernetes deployment the Helm chart renders this
 * file into a ConfigMap mounted over `/config.json`; outside Kubernetes it is
 * generated from environment variables (or a mounted file) at container
 * startup, and falls back to the placeholder shipped in `public/config.json`.
 *
 * The branding mechanism mirrors the baseline used by `nebari-landing`.
 */

/**
 * Keycloak connection settings consumed by `keycloak-js`.
 */
export type KeycloakConfig = {
  /**
   * The base URL of the Keycloak auth server.
   */
  url: string;

  /**
   * The Keycloak realm.
   */
  realm: string;

  /**
   * The OIDC client ID for this SPA.
   */
  clientId: string;
};

/**
 * The Nebari semantic theme tokens that branding may override.
 *
 * Keys are the camelCase form of the CSS custom properties written by the
 * Nebari theme (`--primary`, `--primary-hover`, `--muted-foreground`, …) in
 * `src/main.css`. Unknown keys are ignored.
 */
export const THEME_TOKENS = {
  radius: '--radius',
  background: '--background',
  foreground: '--foreground',
  canvas: '--canvas',
  canvasForeground: '--canvas-foreground',
  header: '--header',
  headerForeground: '--header-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  primaryHover: '--primary-hover',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  mutedForegroundStrong: '--muted-foreground-strong',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  borderStrong: '--border-strong',
  input: '--input',
  ring: '--ring',
  sidebar: '--sidebar',
  sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary',
  sidebarPrimaryForeground: '--sidebar-primary-foreground',
  sidebarAccent: '--sidebar-accent',
  sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border',
  sidebarRing: '--sidebar-ring',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
  headerActionHover: '--header-action-hover',
  signOutForeground: '--sign-out-foreground',
} as const;

/**
 * A type alias for a theme token key.
 */
export type ThemeTokenKey = keyof typeof THEME_TOKENS;

/**
 * Per-color-scheme overrides for the theme tokens.
 */
export type ThemeTokens = Partial<Record<ThemeTokenKey, string>>;

/**
 * Operator-configurable branding.
 *
 * Every field is optional; an unset (or empty) field keeps the built-in Nebari
 * default, so the app looks identical to today when no branding is configured.
 */
export type BrandingConfig = {
  /**
   * The browser tab title. Falls back to the static title in `index.html`.
   */
  title?: string;

  /**
   * URL of a custom logo shown in the sidebar header. Falls back to the
   * built-in Nebari logo.
   */
  logoUrl?: string;

  /**
   * URL of a custom dark-mode logo. Falls back to `logoUrl`, then the built-in
   * Nebari dark logo.
   */
  logoUrlDark?: string;

  /**
   * URL of a custom favicon. Falls back to the built-in Nebari favicon.
   */
  faviconUrl?: string;

  /**
   * CSS variable overrides applied per color scheme.
   */
  theme?: {
    light?: ThemeTokens;
    dark?: ThemeTokens;
  };
};

/**
 * The shape of `/config.json`.
 */
export type AppConfig = {
  /**
   * Keycloak connection settings. Absent when auth is disabled.
   */
  keycloak?: KeycloakConfig;

  /**
   * Branding overrides. Absent (or empty) uses built-in defaults.
   */
  branding?: BrandingConfig;
};

// The cached config, loaded once by `loadAppConfig`.
let _config: AppConfig | null = null;

/**
 * Fetch and cache `/config.json`.
 *
 * Called once at startup before anything else. If the file is missing or
 * malformed, an empty config is returned so the app still boots with built-in
 * defaults rather than failing to load.
 */
export async function loadAppConfig(): Promise<AppConfig> {
  if (_config) {
    return _config;
  }

  try {
    const resp = await fetch('/config.json');
    if (!resp.ok) {
      throw new Error(`Failed to load /config.json: ${resp.status}`);
    }
    _config = (await resp.json()) as AppConfig;
  } catch (error) {
    console.error('Failed to load /config.json, using defaults.', error);
    _config = {};
  }

  // Drop a malformed logo URL so a bad config value can't land in an `<img src>`
  // (defense-in-depth, mirroring the theme-token sanitization below).
  if (_config.branding) {
    _config.branding.logoUrl = sanitizeUrl(_config.branding.logoUrl);
    _config.branding.logoUrlDark = sanitizeUrl(_config.branding.logoUrlDark);
    _config.branding.faviconUrl = sanitizeUrl(_config.branding.faviconUrl);
  }

  return _config;
}

/**
 * Get the config loaded by {@link loadAppConfig}, or `null` if not yet loaded.
 */
export function getAppConfig(): AppConfig | null {
  return _config;
}

// Image MIME types accepted as base64-encoded `data:` URIs. Anything not on
// this list (e.g. text/html) is rejected even when base64-encoded.
const ALLOWED_DATA_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

/**
 * Accept root-relative paths, well-formed http(s) URLs, and `data:` image URIs
 * for a safe-listed set of base64-encoded image MIME types; anything else
 * (including an empty string) becomes `undefined`.
 *
 * `data:image/*;base64,...` URIs were dropped by the original http(s)-only
 * check, which broke deployers who ship an inline base64 logo or favicon. They
 * are restored here while still rejecting `javascript:`, `data:text/html`, and
 * non-base64 `data:` URIs as defense-in-depth.
 */
export function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.startsWith('/')) {
    return value;
  }
  try {
    const { protocol } = new URL(value);
    if (protocol === 'http:' || protocol === 'https:') {
      return value;
    }
    if (protocol === 'data:') {
      // Format: data:<mime>[;base64],<data>. Only accept base64-encoded
      // images from the allow-list; reject text/html, javascript, and the
      // rest.
      const match = /^data:([^;,]+)(;base64)?,/.exec(value);
      if (!match) {
        return undefined;
      }
      const mime = match[1].toLowerCase();
      const isBase64 = Boolean(match[2]);
      return isBase64 && ALLOWED_DATA_MIME_TYPES.has(mime) ? value : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// Block CSS injection vectors: rule terminators, braces, quotes, HTML chars,
// backslash, and url()/expression()/javascript:.
const UNSAFE_CSS = /[;<>{}"'\\]|url\s*\(|expression\s*\(|javascript:/i;

/**
 * Return the value unchanged if it is a safe CSS token, otherwise `undefined`.
 */
export function safeCssValue(value: string | undefined): string | undefined {
  return value && !UNSAFE_CSS.test(value) ? value : undefined;
}

// Build a `--var: value;` block from known, safe tokens, skipping anything
// unknown or unsafe.
const toCssVars = (tokens: ThemeTokens): string =>
  Object.entries(tokens)
    .filter(
      ([k, v]) => k in THEME_TOKENS && v !== undefined && !UNSAFE_CSS.test(v),
    )
    .map(([k, v]) => `  ${THEME_TOKENS[k as ThemeTokenKey]}: ${v};`)
    .join('\n');

/**
 * Apply branding to the DOM.
 *
 * Sets the document title and favicon, and injects a `<style>` element with
 * `:root` (light) and `.dark` (dark) blocks overriding the brand CSS variables.
 * Because the style is appended after `main.css`, the overrides win by cascade
 * order and respond to the existing `.dark` class toggle. Any field left unset
 * keeps its built-in default.
 */
export function applyBranding(branding: BrandingConfig | undefined): void {
  if (!branding) {
    return;
  }

  if (branding.title) {
    document.title = branding.title;
  }

  if (branding.faviconUrl) {
    const link = (document.querySelector("link[rel~='icon']") ??
      Object.assign(document.createElement('link'), {
        rel: 'icon',
      })) as HTMLLinkElement;
    link.href = branding.faviconUrl;
    document.head.appendChild(link);
  }

  if (branding.theme) {
    let css = '';
    if (branding.theme.light) {
      const vars = toCssVars(branding.theme.light);
      if (vars) {
        css += `:root {\n${vars}\n}\n`;
      }
    }
    if (branding.theme.dark) {
      const vars = toCssVars(branding.theme.dark);
      if (vars) {
        css += `.dark {\n${vars}\n}\n`;
      }
    }
    if (css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
}
