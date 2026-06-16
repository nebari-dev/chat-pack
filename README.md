# Nebari Chat Pack

A drop-in chat application for [Nebari](https://www.nebari.dev/), with a React frontend and a [Ravnar](https://github.com/nebari-dev/ravnar)-based backend that speaks the [AG-UI](https://docs.ag-ui.com/introduction) protocol.

The pack ships as a Helm chart that deploys both services and wires them into Nebari's Keycloak for SSO.

## Architecture

| Component | Description | Image |
| --- | --- | --- |
| `frontend/` | React + Vite chat UI, authenticates via Keycloak. | `quay.io/nebari/nebari-chat-frontend` |
| `backend/`  | Ravnar agent server with a Keycloak bearer-token authenticator. | `quay.io/nebari/nebari-chat-backend` |
| `helm/nebari-chat/` | Umbrella chart that deploys the frontend and pulls in the [`ravnar`](https://github.com/nebari-dev/ravnar) chart for the backend. | `oci://quay.io/nebari/charts/nebari-chat` |

The backend is a thin extension of Ravnar — bring your own agents by adding them to the image or mounting them as plugins under `RAVNARPATH`. See [`backend/README.md`](backend/README.md) for the Python package and [`frontend/README.md`](frontend/README.md) for the UI.

## Quick start (Helm)

Requires a Kubernetes cluster with [Nebari](https://www.nebari.dev/) (or a compatible Keycloak + ingress setup).

```sh
helm install chat oci://quay.io/nebari/charts/nebari-chat \
  --set keycloak.url=https://keycloak.example.com \
  --set frontend.nebariapp.hostname=chat.example.com \
  --set backend.nebariapp.hostname=chat-api.example.com
```

See [`helm/nebari-chat/values.yaml`](helm/nebari-chat/values.yaml) for the full set of values.

## Configuration

The chart's top-level values:

| Key | Purpose |
| --- | --- |
| `keycloak.url` / `keycloak.realm` | Keycloak server and realm used by both frontend and backend. |
| `frontend.nebariapp.hostname` | Public hostname for the chat UI. |
| `backend.nebariapp.hostname` | Public hostname for the Ravnar API. |
| `frontend.enabled` | Set `false` to deploy only the backend. |
| `config.inline` | Inline Ravnar config merged into the backend's `config.yml`. |
| `ravnar.image.tag` / `frontend.image.tag` | Override image tags (default: chart `appVersion`). |

## Local development

For running the services outside Kubernetes, see:

- [`frontend/README.md`](frontend/README.md) — `npm run dev`, env vars, Keycloak config.
- [`backend/README.md`](backend/README.md) — the `ravnar-nebari-chat` Python package.

## Release process

Docker images for the frontend and backend are published by pushing a `v$SEMVER` tag (e.g. `v1.2.3`). The Helm chart is published by pushing a `chart/v$SEMVER` tag (e.g. `chart/v1.2.3`).

> [!IMPORTANT]
> Do not push the app and chart tags at the same time. Each tag triggers the release workflow independently, and if the chart tag arrives first, the chart may reference the previous app version instead of the newly tagged one.

## Available tags

Every build publishes a set of tags that depends on what triggered it. `<base>` is the next version computed from the most recent tag (e.g. `1.2.4`); `<semver>` is the version of the release tag (e.g. `1.2.3`); `<n>` is the PR number; `<commit>` is the short commit SHA.

Docker images (`quay.io/nebari/nebari-chat-backend` and `quay.io/nebari/nebari-chat-frontend`):

| Trigger | Tags |
| --- | --- |
| Release (`v$SEMVER`) | `<semver>`, `latest` |
| Push to `main` | `<base>-main`, `main` |
| Pull request | `<base>-pr.<n>.<commit>`, `<base>-pr.<n>`, `pr.<n>` |

Helm chart (`oci://quay.io/nebari/charts/nebari-chat`):

| Trigger | Tags |
| --- | --- |
| Release (`chart/v$SEMVER`) | `<semver>` |
| Push to `main` | `<base>-main` |
| Pull request | `<base>-pr.<n>.<commit>`, `<base>-pr.<n>` |

The exact docker and helm tags for the latest commit on a pull request are also posted as comments on that PR.

## License

Apache 2.0 — see [LICENSE](LICENSE).
