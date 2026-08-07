---
title: REST API
description: The endpoints the chat UI consumes — agents, threads, runs, files, and the AG-UI event stream.
---

The API is [Ravnar](https://github.com/nebari-dev/ravnar)'s: the
[AG-UI](https://docs.ag-ui.com/introduction) protocol plus endpoints for thread history, files,
and identity. This page documents the surface the chat UI actually consumes, as the frontend
calls it — Ravnar is the authority on the rest.

Two hostnames serve it:

- **Directly**, at the backend's own hostname (`backend.nebariapp.hostname`).
- **Same-origin through the UI**, because nginx in the frontend container proxies `/api/` to the
  backend Service. The browser only ever talks to its own origin, which is why there is no CORS
  configuration to get wrong.

Every request carries `Authorization: Bearer <token>` from `keycloak-js`; the frontend's fetch
wrapper refreshes the token before each call. When the frontend is built with
`VITE_AUTH_ENABLED=false` no header is sent, and Ravnar treats the caller as a local user with
full permissions.

## Health

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/health` | Liveness of the Ravnar server. Note it is **not** under `/api`. |

The frontend container serves its own `/healthz` from nginx.

## Application config and identity

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/api/config` | `{ storageEnabled, dynamicAgentsEnabled }` — server capabilities. The UI refuses to run without storage. |
| `GET` | `/api/user` | `{ id, permissions, data }` for the caller. |
| `GET` | `/api/agents` | The agents from `config.yml`: `[{ id, capabilities, quickPrompts }]`. |

`capabilities.identity` (`name`, `provider`, `description`) is what the picker renders;
`quickPrompts` are the suggestion cards shown in an empty chat, each `{ title, description?,
prompt }`.

Do not confuse `GET /api/config` with the frontend's `/config.json` — the latter is a static file
served by nginx that carries Keycloak settings and branding for the browser. See
[Branding & configuration](/branding/).

## Threads

A **thread** is a conversation bound to one agent; a **run** is one turn within it.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/threads` | — | A page of threads. Query params: `pageSize`, `pageNumber` (1-based), `sortBy`, `sortOrder` (`ascending` \| `descending`). |
| `POST` | `/api/threads` | `{ agentId, name? }` | The new `Thread`. |
| `GET` | `/api/threads/{threadId}` | — | One `Thread`. |
| `GET` | `/api/threads/{threadId}/messages` | — | The thread's AG-UI messages. |
| `POST` | `/api/threads/{threadId}/rename` | `{ name }` | The updated `Thread`. |
| `DELETE` | `/api/threads` | `{ ids: [...] }` | Bulk delete. |

A paged response is `{ pageSize, pageNumber, pageCount, totalCount, items }`.

A `Thread` is `{ id, name?, agentId, createdAt, runs: [{ id, threadId, parentRunId?, createdAt
}] }`. There is no `updatedAt` — the UI derives "last activity" from the newest run's
`createdAt`, falling back to the thread's own.

## Runs — the event stream

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/api/threads/{threadId}/runs` | `{ messages, tools, context }` | An SSE stream of AG-UI events. |

- `messages` — the new messages for this turn (a user message, or `tool` result messages when
  resolving a client-side tool call).
- `tools` — the ag-ui definitions of the **client-side** tools the browser is currently
  advertising. Server-side tools are not listed here; the agent already has them.
- `context` — additional client context. The UI sends `[]` today.

The response is `text/event-stream`. Each event's `data` is a JSON AG-UI event —
`RunStarted`, `TextMessageStart` / `TextMessageContent` / `TextMessageEnd`, tool-call events,
`ActivitySnapshot` (how charts and maps arrive — see [Tools](/tools/#how-visualizations-reach-the-ui)),
and `RunFinished`. The frontend skips any single event that fails to parse or validate rather
than dropping the stream, and aborting the request cancels the run.

When the agent calls a client-side tool, the run finishes **without** a result for that call. The
browser executes the tool and POSTs a follow-up run carrying the `tool` result messages; see
[the run loop](/tools/#the-run-loop).

## Files

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/api/files` | An ag-ui input content object (`image`, `audio`, `video`, or `document`) | A file handle. |

Uploads return a lightweight handle rather than echoing the bytes: an object whose `source.mimeType`
is `application/vnd.ravnar.json-b64` and whose `source.value` is a base64-encoded JSON blob
containing `fileId`, the real `mimeType`, `sourceType`, and `createdAt`. The handle is
type-compatible with ag-ui input content, so it drops straight into the `content` array of a user
message — keeping the message stream small.

Uploading requires `files:read` and `files:write`; without them the UI hides attachments.

## Permissions

Ravnar permissions are `<resource>:<action>` over the resources `files`, `threads`, and `agents`,
with actions `read`, `write`, and `delete`. The pack's Keycloak authenticator grants every
validated caller the full set — a narrower model means supplying your own authenticator (see
[Agents & models](/agents/#authentication)).

`GET /api/user` reports what the caller has. The UI requires `threads:read`, `threads:write`,
`threads:delete`, and `agents:read` to load at all, and treats `files:read` + `files:write` as
optional, degrading to a chat without attachments.

## Calling it directly

```bash
TOKEN=$(...)   # a Keycloak access token for the realm

curl -H "Authorization: Bearer $TOKEN" https://chat-api.example.com/api/agents

THREAD=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"agentId":"claude","name":"from curl"}' \
  https://chat-api.example.com/api/threads | jq -r .id)

curl -N -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","id":"'"$(uuidgen)"'","content":[{"type":"text","text":"Hello"}]}],"tools":[],"context":[]}' \
  "https://chat-api.example.com/api/threads/$THREAD/runs"
```

`curl -N` disables buffering so you see the SSE events as they stream.
