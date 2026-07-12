# Design: Generic OIDC Auth for the Frontend

## Summary

Replace the hardcoded `keycloak-js` dependency in the frontend with `oidc-spa`, a library that implements the same OIDC flow abstracted over any OpenID Connect provider. The runtime config file changes from a Keycloak-specific schema (`auth-server-url` + `realm`) to a provider-agnostic schema (`issuer` + `client_id`). The public API surface of `src/auth/index.ts` stays the same. On the backend, delete `_authenticators.py` — the `BearerTokenAuthenticator` + `OIDCTokenValidator` stack can be declared inline in `config.yaml` via Ravnar's `ImportStringWithParams` resolution. A single `oidc` values block replaces the old `keycloak` block.

## Goals

- Frontend authenticates against **any OIDC-compliant identity provider** (Keycloak, Auth0, Okta, Azure AD, Google, etc.).
- All existing callers of `@/auth` — `fetch()`, `login()`, `logout()`, `getUserProfile()` — continue to work without changes.
- The `VITE_AUTH_ENABLED=false` dev bypass continues to work.
- Delete `src/ravnar_nebari_chat/_authenticators.py` — the backend auth is declared inline in `config.yaml` using Ravnar's dynamic import system.
- Single `oidc` values block in Helm for both frontend and backend config.
- Remove the dead `frontend.keycloak` block from values.

## Non-Goals

- Gateway-level auth. The NebariApp operator still handles ingress authentication and OIDC client provisioning; this design only touches the SPA-side auth and the backend's token validation config.
- Runtime multi-provider switching. The config declares one issuer per deployment.
- Changes to Ravnar itself.

## Background / Motivation

The Nebari Chat Pack frontend uses `keycloak-js` directly, which ties it to Keycloak as the identity provider. The runtime config (`public/keycloak-config.json`) uses Keycloak-specific fields (`auth-server-url`, `realm`, `resource`).

The backend currently has a thin factory `ravnar_nebari_chat.keycloak_authenticator` that concatenates `keycloak_url` + `realm` into an issuer URL and wraps `OIDCTokenValidator` in `BearerTokenAuthenticator`. The `OIDCTokenValidator` is already fully generic — this factory is entirely wiring. With Ravnar's `ImportStringWithParams` (which recursively resolves nested `cls_or_fn` in `params`), the same wiring can be expressed declaratively in YAML, eliminating the custom Python module.

## Design

### 1. Library: `oidc-spa`

Replace `keycloak-js` with [`oidc-spa`](https://docs.oidc-spa.dev/) (npm `oidc-spa`).

**Why `oidc-spa` over alternatives:**

| Library | Why it fits |
|---------|-------------|
| `oidc-client-ts` | Mature (2M weekly downloads), but framework-agnostic — we'd need to wire React context and TanStack Router integration ourselves. |
| `oidc-spa` | From the Keycloakify team (Keycloak experts). **First-class TanStack Router integration** (used by this project). Explicitly designed as a `keycloak-js` drop-in that works with any OIDC provider. Smaller API surface. |

The project already uses TanStack Router, so `oidc-spa`'s native integration avoids boilerplate. The migration from `keycloak-js` is the library's primary use case.

### 2. Runtime Config: `public/auth-config.json`

Replace `public/keycloak-config.json` with `public/auth-config.json`.

```json
{
  "issuer": "https://keycloak.example.com/realms/nebari",
  "client_id": "nebari-chat-dev-spa"
}
```

**Schema:**

| Key | Required | Description |
|-----|----------|-------------|
| `issuer` | Yes | Full OIDC issuer URL (e.g. `https://keycloak.example.com/realms/nebari`) |
| `client_id` | Yes | Public SPA client ID registered with the IdP |

**Removed fields compared to old format:** `auth-server-url`, `realm`, `resource` — all superseded by the flat `issuer` URL.

**Not in config (hardcoded in JS):**

| Setting | Value | Rationale |
|---------|-------|-----------|
| `redirect_uri` | `window.location.origin` | Runtime-computed; matches how the current code passes it to keycloak.login/logout. |
| `scope` | `"openid email name"` | User explicitly chose to hardcode this. |

### 3. `src/auth/index.ts` Changes

The module's public API stays the same:

```ts
export class FetchError extends Error { … }
export async function fetch(url, init?): Promise<Response> { … }
export async function login(): Promise<void> { … }
export async function logout(): Promise<void> { … }
export function getUserProfile(): UserProfile | null { … }
export type UserProfile = { name: string; email: string };
```

**Internal changes:**

1. **Remove `import Keycloak from 'keycloak-js'`** — replace with oidc-spa initialization.
2. **Config loading** — `fetch('/auth-config.json')` at module init instead of `new Keycloak('/keycloak-config.json')`.
3. **Initialization** — `createOidc()` from oidc-spa, wrapping the config fetch.
4. **`fetch()`** — reads the access token from the oidc-spa session instead of `keycloak.token`.
5. **`login()`** — calls `oidc.login({ redirectUri: window.location.origin })` instead of `keycloak.login()`.
6. **`logout()`** — calls `oidc.logout({ redirectUri: window.location.origin })` instead of `keycloak.logout()`.
7. **`getUserProfile()`** — reads `name` and `email` from the decoded ID token claims via oidc-spa's `getUser()` or decoded token accessor.

The top-level `await` pattern (currently `await keycloak.init()`) stays. The `VITE_AUTH_ENABLED` guard keeps the same behavior:

```ts
// Pseudocode of the new init flow
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

let oidc: Oidc | null = null;

if (AUTH_ENABLED) {
  const configResp = await fetch('/auth-config.json');
  const config = await configResp.json();
  oidc = await createOidc({
    issuerUrl: config.issuer,
    clientId: config.client_id,
    redirectUri: window.location.origin,
  });
}
```

### 4. Caller Changes

Zero changes to callers. All four consumption sites reference `@/auth` purely through the exported functions:

| File | Uses | Impact |
|------|------|--------|
| `src/routes/_authenticated.tsx` | `auth.login()` | None — same function signature. |
| `src/routes/logout.tsx` | `auth.logout()` | None — same function signature. |
| `src/sidebar/userprofile.tsx` | `auth.getUserProfile()` | None — same return type. |
| `src/api/*.ts` | `auth.fetch()` | None — same function signature. |

The `FetchError` class is also unchanged.

### 5. Backend: Delete `_authenticators.py`, Inline Auth Config

**Delete** `src/ravnar_nebari_chat/_authenticators.py`. The factory function is no longer needed — Ravnar's `ImportStringWithParams` resolves nested `cls_or_fn` blocks in YAML, so the `BearerTokenAuthenticator` + `OIDCTokenValidator` wiring moves into `config.yaml`.

The backend `config.yaml` becomes:

```yaml
security:
  authenticator:
    cls_or_fn: _ravnar.authenticators.BearerTokenAuthenticator
    params:
      token_validator:
        cls_or_fn: _ravnar.authenticators.OIDCTokenValidator
        params:
          issuer: '{{ required "oidc.issuer is required" .Values.oidc.issuer }}'
          default_permissions:
            - threads:read
            - threads:write
            - threads:delete
            - agents:read
```

Ravnar's `ImportStringWithParams._validate_nested` recursively processes `cls_or_fn` keys inside `params`, constructing the inner `OIDCTokenValidator` first and passing it as the `token_validator` argument to `BearerTokenAuthenticator`.

### 6. Helm Chart Changes

**`values.yaml` — replace `keycloak` block with `oidc` block:**

```yaml
# Removed
keycloak:
  url: ""
  realm: "nebari"
  clientId: ""

# Removed (dead key — never referenced in templates)
frontend:
  ...
  keycloak: ...

# Added
oidc:
  # Full OIDC issuer URL, e.g. https://keycloak.example.com/realms/nebari
  issuer: ""
  # SPA client ID. If not set, defaults to a generated value matching the current scheme.
  clientId: ""
```

**`templates/frontend-configmap.yaml` — generate `auth-config.json`:**

```yaml
data:
  auth-config.json: |
    {{
      dict
        "issuer" (required "oidc.issuer is required" .Values.oidc.issuer)
        "client_id" (.Values.oidc.clientId | default (printf "%s-%s-spa" .Release.Namespace ...))
      | toPrettyJson | nindent 4
    }}
```

**`templates/frontend-deployment.yaml` — update volume mount path:**

```
mountPath: /usr/share/nginx/html/auth-config.json
subPath: auth-config.json
```

**`config.yaml` — backend auth config uses the same `oidc` values:**

```yaml
security:
  authenticator:
    cls_or_fn: _ravnar.authenticators.BearerTokenAuthenticator
    params:
      token_validator:
        cls_or_fn: _ravnar.authenticators.OIDCTokenValidator
        params:
          issuer: '{{ required "oidc.issuer is required" .Values.oidc.issuer }}'
          default_permissions:
            - threads:read
            - threads:write
            - threads:delete
            - agents:read
```

A Keycloak default can be provided in the chart's `values.yaml`:

```yaml
oidc:
  issuer: ""
  clientId: ""
```

The deployer sets `oidc.issuer` to the full issuer URL (e.g., `https://keycloak.example.com/realms/nebari`). For the default Nebari Keycloak deployment, this is the same URL the old `keycloak.url` + `keycloak.realm` concatenated to.

### 7. `.env` / Dev Experience

No changes. `VITE_AUTH_ENABLED=false` continues to bypass auth entirely. When developing against a real IdP, the developer creates a local `public/auth-config.json` (added to `.gitignore` like `.env`).

## Tradeoffs & Risks

| Risk | Mitigation |
|------|------------|
| **oidc-spa is newer** than `oidc-client-ts`. While actively maintained (Keycloakify team), it has a smaller userbase. | The surface area we use is narrow (init, login, logout, get token, parse ID token). If oidc-spa has issues, switching to `oidc-client-ts` is a confined change within `src/auth/index.ts`. |
| **Breaking change — `keycloak` values block removed.** Existing deployments must migrate to `oidc.issuer` + `oidc.clientId`. The old `keycloak_config`+`realm` two-value scheme is replaced by a single issuer URL. | Acceptable per user. The `required` directive in the ConfigMap template makes the fix obvious. |
| **Breaking change — `keycloak-config.json` file no longer served.** The frontend now loads `auth-config.json`. | The frontend image must be updated to load the new filename. No backward-compat shim. |
| **Removing `_authenticators.py`** — if any external deployment imports `ravnar_nebari_chat.keycloak_authenticator`, it breaks. | This is an internal module used only by the chart's `config.yaml`. No external consumers known. |
| **Backend `config.yaml` uses Ravnar-internal dotted paths** (`_ravnar.authenticators.*`). These are not a public Ravnar API and could change between versions. | The `BearerTokenAuthenticator` and `OIDCTokenValidator` classes are core to Ravnar's auth model and unlikely to change incompatibly. If they do, the factory function would have broken too — the difference is just where the import path lives. |

## Testing Strategy

### Dev-mode bypass

- `VITE_AUTH_ENABLED=false` — the auth module skips OIDC init entirely, `fetch()` adds no bearer header, `login()`/`logout()` are no-ops. Existing behavior preserved.

### Unit / self-check

- The auth module has no existing tests. Add a minimal assertion-based `__main__` self-check in `src/auth/index.ts` that validates `public/auth-config.json` can be loaded and parsed, and that an `issuer` URL looks like a URL (starts with `https://`). This catches config issues at import time rather than at login.

### Manual smoke test (Keycloak)

1. Deploy with `oidc.issuer` and `oidc.clientId` set (e.g. `oidc.issuer: https://keycloak.example.com/realms/nebari`).
2. Visit the app — should redirect to Keycloak login.
3. Log in — should return to the app with user profile shown in sidebar.
4. Log out — should redirect to Keycloak logout and return to the app's login page.
5. Refresh the page while authenticated — session persists.

### Manual smoke test (alternative OIDC provider)

1. Deploy with `oidc.issuer` pointed at a non-Keycloak OIDC provider (e.g., Auth0 or Okta dev tenant).
2. Repeat steps 2–5 above.

### Browser storage

- Verify that no `keycloak-*` keys remain in `localStorage` or `sessionStorage` after the migration. `oidc-spa` uses `oidc-spa:*` prefixed keys — the old keys are orphaned but harmless.

## Open Questions

*(None — all decisions resolved during design.)*
