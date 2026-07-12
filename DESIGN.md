# Design: Generic OIDC Auth for the Frontend

## Summary

Replace the hardcoded `keycloak-js` dependency in the frontend with `oidc-spa`, a library that implements the same OIDC flow abstracted over any OpenID Connect provider. The runtime config file changes from a Keycloak-specific schema (`auth-server-url` + `realm`) to a provider-agnostic schema (`issuer` + `client_id`). The public API surface of `src/auth/index.ts` stays the same. The backend already works with any OIDC issuer via Ravnar's `OIDCTokenValidator` and is untouched by this design.

## Goals

- Frontend authenticates against **any OIDC-compliant identity provider** (Keycloak, Auth0, Okta, Azure AD, Google, etc.).
- All existing callers of `@/auth` — `fetch()`, `login()`, `logout()`, `getUserProfile()` — continue to work without changes.
- The `VITE_AUTH_ENABLED=false` dev bypass continues to work.
- The Helm chart generates generic OIDC config instead of Keycloak-specific JSON.
- **No backend changes** — the backend's `keycloak_authenticator` helper stays as-is; it already works with any OIDC issuer.

## Non-Goals

- **Backend changes.** The backend's `keycloak_authenticator` is already OIDC-generic underneath (`OIDCTokenValidator` accepts any issuer URL). It stays completely untouched — it's just a convenience helper that concatenates `keycloak_url` + `realm` into an issuer URL. No backend source, config, deployment, or Helm template changes in this design.
- Gateway-level auth. The NebariApp operator still handles ingress authentication and OIDC client provisioning; this design only touches the SPA-side auth.
- Runtime multi-provider switching. The config file declares one issuer per deployment.

## Background / Motivation

The Nebari Chat Pack frontend uses `keycloak-js` directly, which ties it to Keycloak as the identity provider. The runtime config (`public/keycloak-config.json`) uses Keycloak-specific fields (`auth-server-url`, `realm`, `resource`). The backend is already generic — `ravnar_nebari_chat.keycloak_authenticator` is just a convenience wrapper that feeds `keycloak_url` + `realm` into Ravnar's `OIDCTokenValidator`, which accepts any OIDC issuer URL. Any deployment already points the backend at the correct issuer by overriding the Keycloak URL.

The Nebari default deployment uses Keycloak, and the gateway-level auth (NebariApp operator) will continue to reference Keycloak. This design only decouples the frontend SPA authentication from the Keycloak SDK, so deployments using a different IdP can swap it out by changing a config file.

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

### 5. Helm Chart Changes (frontend only)

**`values.yaml` — add `auth` block for frontend config. The existing `keycloak` block is untouched (backend still uses it).**

```yaml
# Existing (unchanged — backend still references .Values.keycloak.url)
keycloak:
  url: ""
  realm: "nebari"
  clientId: ""

# Added (frontend only)
auth:
  # The full OIDC issuer URL, e.g. https://keycloak.example.com/realms/nebari
  issuer: ""
  # The SPA client ID. If not set, defaults to a generated value matching the current scheme.
  clientId: ""
```

**`templates/frontend-configmap.yaml` — generate `auth-config.json` instead of `keycloak-config.json`:**

```yaml
data:
  auth-config.json: |
    {{
      dict
        "issuer" (required "auth.issuer is required" .Values.auth.issuer)
        "client_id" (.Values.auth.clientId | default (printf "%s-%s-spa" .Release.Namespace ...))
      | toPrettyJson | nindent 4
    }}
```

**`templates/frontend-deployment.yaml` — update volume mount path:**

```
mountPath: /usr/share/nginx/html/auth-config.json
subPath: auth-config.json
```

The mount uses `subPath` so only the single file is mounted into the nginx static directory.

### 6. `.env` / Dev Experience

No changes. `VITE_AUTH_ENABLED=false` continues to bypass auth entirely. When developing against a real IdP, the developer creates a local `public/auth-config.json` (added to `.gitignore` like `.env`).

## Tradeoffs & Risks

| Risk | Mitigation |
|------|------------|
| **oidc-spa is newer** than `oidc-client-ts`. While actively maintained (Keycloakify team), it has a smaller userbase. | The surface area we use is narrow (init, login, logout, get token, parse ID token). If oidc-spa has issues, switching to `oidc-client-ts` is a confined change within `src/auth/index.ts`. |
| **Breaking config format change.** Existing deployments upgrading the chart must migrate from `keycloak.*` values to `auth.*` values for the frontend ConfigMap. The backend's `keycloak.*` values for `keycloak_authenticator` are untouched. | Document the migration in the release notes. The frontend `auth-config.json` is a separate ConfigMap from the backend config, so the two can be migrated independently. No backward-compat shim — the user confirmed BC can break. |
| **`window.location.origin` as `redirect_uri`** may not cover all deployment topologies (e.g., app behind a reverse proxy with a different external origin). | The NebariApp operator already handles this via the `hostname` field. The SPA always runs at `window.location.origin`. If a future deployment needs a different redirect URI, it can be added to the config file. |
| **Scope hardcoded to `openid email name`.** If a deployment needs extra scopes (e.g., for group claims), the config file would need a `scope` field. | Add when needed — changing the hardcoded default to a configurable value is a one-line change. |

## Testing Strategy

### Dev-mode bypass

- `VITE_AUTH_ENABLED=false` — the auth module skips OIDC init entirely, `fetch()` adds no bearer header, `login()`/`logout()` are no-ops. Existing behavior preserved.

### Unit / self-check

- The auth module has no existing tests. Add a minimal assertion-based `__main__` self-check in `src/auth/index.ts` that validates `public/auth-config.json` can be loaded and parsed, and that an `issuer` URL looks like a URL (starts with `https://`). This catches config issues at import time rather than at login.

### Manual smoke test (Keycloak)

1. Deploy with `auth.issuer` and `auth.clientId` set (the existing `keycloak.*` values still serve the backend).
2. Visit the app — should redirect to Keycloak login.
3. Log in — should return to the app with user profile shown in sidebar.
4. Log out — should redirect to Keycloak logout and return to the app's login page.
5. Refresh the page while authenticated — session persists.

### Manual smoke test (alternative OIDC provider)

1. Deploy with `auth.issuer` pointed at a non-Keycloak OIDC provider (e.g., Auth0 or Okta dev tenant). The backend `keycloak.*` values stay set to the same issuer so `keycloak_authenticator` validates tokens from that issuer.
2. Repeat steps 2–5 above.

### Browser storage

- Verify that no `keycloak-*` keys remain in `localStorage` or `sessionStorage` after the migration. `oidc-spa` uses `oidc-spa:*` prefixed keys — the old keys are orphaned but harmless.

## Open Questions

*(None — all decisions resolved during design.)*
