---
title: Chat Pack
description: A drop-in chat application for Nebari — a React AG-UI client and a Ravnar agent server, wired into Keycloak SSO by one Helm chart.
---

The Nebari Chat Pack is a drop-in **chat application** for a [Nebari](https://www.nebari.dev/)
cluster. Users get a browser chat UI behind Keycloak SSO; operators get one Helm chart that
deploys both halves and hands routing, TLS, and authentication to the
[nebari-operator](https://github.com/nebari-dev/nebari-operator).

The two halves talk over the [AG-UI](https://docs.ag-ui.com/introduction) protocol:

- **frontend** — a React + Vite AG-UI client. It knows nothing about models or agents; it
  renders whatever the server streams and executes the browser-side tools it advertises.
- **backend** — a thin extension of [Ravnar](https://github.com/nebari-dev/ravnar), an agent
  server that speaks AG-UI plus thread-history endpoints. The pack adds a Keycloak bearer-token
  authenticator and a set of demo agents.

Everything a deployment cares about converges on two files: the backend's **Ravnar config**
(which agents exist, which models they use, how callers are authenticated) and the chart's
**values** (hostnames, Keycloak, branding). Neither requires rebuilding an image.

## What ships today

| Component | What it is | Image / chart |
| --- | --- | --- |
| `frontend/` | React 19 + Vite chat UI — threads, history, markdown/LaTeX rendering, charts, maps, file attachments, a client-side tools panel, and light/dark theming. Authenticates with `keycloak-js`. | `quay.io/nebari/nebari-chat-frontend` |
| `backend/` | The `ravnar-nebari-chat` Python package: a Keycloak authenticator, demo agent factories, and the database/visualization tools they use. | `quay.io/nebari/nebari-chat-backend` |
| `helm/nebari-chat/` | Umbrella chart that deploys the frontend and pulls in the upstream [`ravnar`](https://github.com/nebari-dev/ravnar) chart for the backend, emitting a `NebariApp` for each. | `oci://quay.io/nebari/charts/nebari-chat` |

Both services are exposed at their own hostname:

```
https://chat.example.com        # the chat UI
https://chat-api.example.com    # the Ravnar API
```

## In this guide

- **[Getting started](/getting-started/)** — install the chart on a Nebari cluster and open your
  first chat
- **[Agents & models](/agents/)** — what `config.yml` declares, and how to add your own agent
- **[Tools](/tools/)** — the server-side and browser-side tools agents can call, and how to add
  more
- **[Branding & configuration](/branding/)** — re-brand the UI without rebuilding the image
- **[Local development](/local-development/)** — run both services on your laptop

## Reference pages

- **[Helm values](/helm-values/)** — every value the chart accepts, plus the ones that pass
  through to the `ravnar` subchart
- **[REST API](/api-reference/)** — the endpoints the frontend consumes
- **[Architecture & auth](/architecture/)** — how the pieces fit together and how authentication
  works

## Bring your own agents

The demo agent factories in this package are starting points, not the product. An agent is any
object Ravnar can construct from a dotted path plus params — usually a
[pydantic-ai](https://ai.pydantic.dev/) `Agent` wrapped by `PydanticAiAgentWrapper`. Point the
config at your own factory (baked into the image, or mounted as a plugin under
`RAVNARPATH`), and it appears in the UI's agent picker with no frontend change at all. See
[Agents & models](/agents/).
