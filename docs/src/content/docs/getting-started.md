---
title: Getting started
description: Install the Nebari Chat Pack Helm chart on a Nebari cluster and open your first chat.
---

## Prerequisites

- A Kubernetes cluster running [Nebari](https://www.nebari.dev/) with the
  [nebari-operator](https://github.com/nebari-dev/nebari-operator) installed — it provides the
  `NebariApp` CRD (`reconcilers.nebari.dev/v1`) the chart emits, and turns it into routing, TLS,
  and Keycloak clients.
- A Keycloak realm the cluster's users log in to (`nebari` by default).
- Helm 3.8+ (OCI registry support).
- An API key for the model provider your agents use. The examples below call
  [OpenRouter](https://openrouter.ai/) and read `OPENROUTER_API_KEY` from the backend's
  environment.
- Two DNS names pointing at the cluster gateway — one for the UI, one for the API.

## Prepare the namespace

The chart renders the release namespace itself, labeled `nebari.dev/managed=true`. Without that
label the nebari-operator ignores the `NebariApp` resources in it and nothing gets routed.

Because the namespace is part of the release, create it with Helm's ownership metadata already
in place so Helm can adopt it:

```bash
kubectl create namespace chat
kubectl label namespace chat app.kubernetes.io/managed-by=Helm
kubectl annotate namespace chat \
  meta.helm.sh/release-name=chat \
  meta.helm.sh/release-namespace=chat
```

> Use the same release name (`chat`) in the annotations and in `helm install` below. Helm
> refuses to take over a resource whose ownership annotations name a different release.

## Provide the model API key

Keep the key out of your values file — put it in a Secret and reference it:

```bash
kubectl create secret generic openrouter -n chat \
  --from-literal=api-key=sk-or-...
```

## Install

The chart renders the backend's config from the Keycloak authenticator plus whatever you put in
`config.inline`. No agent declarations ship with the image, so an install with no `config.inline`
leaves you with Ravnar's built-in `default` placeholder, which replies "I'm not terribly helpful
right now". Declare at least one real agent up front:

```yaml
# chat-values.yaml
keycloak:
  url: https://keycloak.example.com
  realm: nebari

frontend:
  nebariapp:
    hostname: chat.example.com

backend:
  nebariapp:
    hostname: chat-api.example.com

ravnar:
  extraEnv:
    OPENROUTER_API_KEY:
      valueFrom:
        secretKeyRef:
          name: openrouter
          key: api-key

config:
  inline:
    agents:
      static:
        claude:
          cls_or_fn: ravnar.agents.PydanticAiAgentWrapper
          params:
            agent:
              cls_or_fn: pydantic_ai.Agent
              params:
                model:
                  cls_or_fn: pydantic_ai.models.openrouter.OpenRouterModel
                  params:
                    model_name: anthropic/claude-sonnet-4.6
                    provider:
                      cls_or_fn: pydantic_ai.providers.openrouter.OpenRouterProvider
                      params:
                        # Escaped so Helm emits the literal placeholder — see the note below.
                        api_key: '{{ "{{ OPENROUTER_API_KEY }}" }}'
            capabilities:
              identity:
                name: Chat Agent (Claude Sonnet 4.6)
                provider: Anthropic
                description: General-purpose chat agent.
```

```bash
helm install chat oci://quay.io/nebari/charts/nebari-chat \
  --namespace chat -f chat-values.yaml
```

`keycloak.url`, `frontend.nebariapp.hostname`, and `backend.nebariapp.hostname` are required —
the chart fails to render without them.

> **Escape Ravnar's placeholders.** Ravnar resolves `{{ VAR }}` in `config.yml` from the
> backend's environment, but the chart runs every `config.inline` string through Helm's `tpl`
> first, so a bare `{{ OPENROUTER_API_KEY }}` fails the render with
> `function "OPENROUTER_API_KEY" not defined`. Wrap it as `'{{ "{{ OPENROUTER_API_KEY }}" }}'`
> and the ConfigMap gets the literal placeholder Ravnar expects.

This deploys, for a release named `chat` in namespace `chat`:

| Object | Purpose |
| --- | --- |
| `Deployment/chat-nebari-chat-frontend` | nginx serving the built SPA on port 8080; proxies `/api/` to the backend Service. |
| `Deployment/chat-ravnar` | The Ravnar agent server (`ravnar serve`) on port 8000. |
| `StatefulSet/chat-ravnar-postgres` | PostgreSQL holding threads, runs, and messages. |
| `PersistentVolumeClaim/chat-ravnar-persistent-file-storage` | File storage for user uploads. |
| `ConfigMap/chat-backend` | The rendered backend config — your `config.inline` merged with the Keycloak authenticator, mounted at `/var/ravnar/helm/config.yaml`. |
| `ConfigMap/chat-nebari-chat-frontend` | The `/config.json` the browser fetches (Keycloak + branding) and the `API_URL` nginx proxies to. |
| `NebariApp/chat-nebari-chat-frontend` | Routing, TLS, and a Keycloak SPA client for the UI; adds a "Chat" tile to the landing page. |
| `NebariApp/chat-nebari-chat-backend` | Routing and TLS for the API. |

See [Helm values](/helm-values/) for everything you can configure, and
[Architecture & auth](/architecture/) for how these fit together.

## Verify

```bash
# Both NebariApps should reach Ready — that is routing, TLS, and OIDC clients.
kubectl get nebariapp -n chat

# Workloads
kubectl get deploy,sts,svc -n chat

# The backend's own view of its config
kubectl logs -n chat deploy/chat-ravnar
```

Then open `https://chat.example.com`. You should be redirected to Keycloak, land back on the
home page, and see the agents you declared in `config.inline` in the picker. Pick one, send a
message, and the response streams back token by token.

The API answers directly too:

```bash
curl https://chat-api.example.com/health
```

## Where to go next

- Declare the agents your users actually need — [Agents & models](/agents/).
- Give agents tools, in Python or in the browser — [Tools](/tools/).
- Put your own name, logo, and colors on it — [Branding & configuration](/branding/).

## Troubleshooting

- **`Error: ... namespace "chat" exists and cannot be imported into the current release`** — the
  namespace was created outside the release. Apply the label and annotations from
  [Prepare the namespace](#prepare-the-namespace), matching your release name.
- **`keycloak.url is required` / `frontend.nebariapp.hostname is required`** — the chart's
  `required` guards. Set every value listed in [Install](#install).
- **The UI loads but every request 401s** — the browser's token is not accepted by the backend.
  Check that `keycloak.url` and `keycloak.realm` are identical for both halves (they come from
  the same top-level values) and that the backend can reach the realm's OIDC discovery document
  from inside the cluster.
- **The UI shows "Storage Not Enabled"** — the backend booted with `storage.enabled: false`. The
  chart leaves Ravnar's default (enabled) alone, so check for an override in `config.inline`.
- **The UI shows "Insufficient Permissions"** — the authenticated user is missing one of
  `threads:read`, `threads:write`, `threads:delete`, or `agents:read`. See
  [Permissions](/api-reference/#permissions).
- **Agents error on every message** — usually a missing or invalid model API key. Confirm the
  env var reached the pod: `kubectl exec -n chat deploy/chat-ravnar -- env | grep OPENROUTER`,
  and that the rendered config kept the placeholder:
  `kubectl get cm chat-backend -n chat -o yaml | grep api_key`.
- **`function "..." not defined` while rendering** — an unescaped Ravnar `{{ VAR }}` placeholder
  in `config.inline`. See the note under [Install](#install).
- **`NebariApp` never becomes Ready** — `kubectl describe nebariapp -n chat` reports the
  reconcile failure; a missing `nebari.dev/managed=true` label on the namespace is the usual
  cause.
