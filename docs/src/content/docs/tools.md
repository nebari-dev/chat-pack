---
title: Tools
description: Server-side Python tools and browser-side TypeScript tools — what ships, how they run, and how to add your own.
---

An agent calls a tool either **on the server** or **in the browser**:

- **Server-side tools** are Python functions registered on the agent. They run inside the Ravnar
  pod when the agent calls them, and are always advertised.
- **Client-side tools** are TypeScript functions in the frontend. They are advertised per-browser
  with the run, execute in the user's tab, and can be toggled from the **tools panel** in the UI.

The split matters: server tools reach cluster resources — databases, internal APIs, the file
system — while client tools reach things only the browser has: the user's location, their
clipboard, their consent.

Everything below ships as an **example**. They are deliberately small, and are meant to be
replaced by the tools your own agents need.

## Server-side tools

Registered with pydantic-ai's `@agent.tool_plain` decorator, attached by the factories under
[`backend/src/ravnar_nebari_chat/demo_agents/_tools/`](https://github.com/nebari-dev/nebari-chat-pack/tree/main/backend/src/ravnar_nebari_chat/demo_agents/_tools).
Both demo data agents (`austin-permits`, `sbir-awards`) use all four.

| Tool | Parameters | What it does |
| --- | --- | --- |
| `get_database_schema` | _none_ | Runs the factory's configured schema query so the agent understands the tables before writing SQL. (`_tools/database.py`) |
| `execute_query` | `query` — an SQL string | Executes the query through an async SQLAlchemy engine and returns the rows. (`_tools/database.py`) |
| `create_chart` | `config` — an Apache ECharts config object | Renders a chart in the UI. (`_tools/visualization.py`) |
| `create_map` | `data` — `center: [lat, lon]` plus a GeoJSON `FeatureCollection` | Renders a Leaflet map with markers and popups. (`_tools/visualization.py`) |

### How visualizations reach the UI

The visualization tools do not return an image. They return a `ToolReturn` whose metadata carries
an ag-ui `ActivitySnapshotEvent` with a content type the frontend knows how to render:

| Activity type | Rendered by |
| --- | --- |
| `application/json+echart` | [ECharts](https://echarts.apache.org/) in `components/charts/echartrenderer.tsx` |
| `application/json+leaflet` | [Leaflet](https://leafletjs.com/) in `components/maps/leafletrenderer.tsx` |

To add a new visualization type, emit an `ActivitySnapshotEvent` with your own content type from
the backend and add a case for it in `frontend/src/chat/activitymessage.tsx`.

### The database tools are read-only by convention

`execute_query` will run whatever SQL the model writes. The demo agents' system prompts tell the
model not to modify anything, and the demo databases are mounted read-only so attempts fail — but
the *enforcement* is the database's grants, not the tool. If you point these tools at your own
database, connect with a role that only has `SELECT`.

### Adding a server-side tool

Decorate a function inside your agent factory. The docstring is the tool description the model
sees, and the type annotations become its parameter schema:

```python
from pydantic_ai import Agent


def add_ticket_tools(agent: Agent, *, base_url: str) -> None:
    @agent.tool_plain
    async def lookup_ticket(ticket_id: str) -> dict:
        """Look up a support ticket by its id.

        Use this before answering any question about a specific ticket.
        """
        ...
```

Then call `add_ticket_tools(agent, base_url=...)` from your factory, exactly as the demo
factories call `add_database_tools` and `add_visualization_tools`. See
[Agents & models](/agents/#adding-your-own-agent).

## Client-side tools

Registered in
[`frontend/src/chat/tools/registry.ts`](https://github.com/nebari-dev/nebari-chat-pack/blob/main/frontend/src/chat/tools/registry.ts).
Each tool pairs an ag-ui `definition` (name plus JSON-Schema parameters) advertised to the agent
with an async `handler` that runs locally.

| Tool | Parameters | Default | What it does |
| --- | --- | --- | --- |
| `get_current_location` | _none_ | enabled | Reads the user's coordinates via the browser Geolocation API. The browser prompts for permission; a denial or an unavailable API returns `{ error }` rather than failing the run. |
| `request_user_approval` | `action` (required), `details` (optional) | disabled | A human-in-the-loop gate. The run pauses, an approval card appears, and the promise resolves only once the user decides — returning `{ decision: 'approved' \| 'rejected' }`. Requests are scoped to the thread that raised them. |

Users toggle these in the tools panel; a disabled tool is never advertised to the agent, so the
model cannot call it at all.

### The run loop

Client tools require a round trip, which the frontend drives:

1. The run is submitted with the definitions of the currently enabled tools.
2. The agent calls one; the backend emits the tool-call events and finishes the run **without** a
   result, because the tool executes elsewhere.
3. The frontend finds tool calls that have no result, runs their handlers, and appends `tool`
   result messages.
4. It resubmits those results as a follow-up run, re-advertising the tools so the agent can call
   again.

This repeats until a run finishes with no outstanding client tool calls, capped at **5 rounds**
(`MAX_FRONTEND_TOOL_ROUNDS`) so a model that keeps calling tools cannot loop forever. A handler
that throws is captured as `{ error: ... }` and returned to the agent, so one failing tool never
tears down the run.

### Adding a client-side tool

Implement a `FrontendTool` and append it to `FRONTEND_TOOLS`:

```ts
import type { FrontendTool } from './types';

export const copyToClipboardTool: FrontendTool = {
  definition: {
    name: 'copy_to_clipboard',
    description: "Copy text to the user's clipboard.",
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
      additionalProperties: false,
    },
  },

  // Omit for on-by-default; set false to ship the tool opt-in.
  defaultEnabled: false,

  handler: async (args) => {
    await navigator.clipboard.writeText(String(args.text));
    return { copied: true };
  },
};
```

The handler also receives a context object carrying the `threadId` of the run, which is how
`request_user_approval` ties its card to the thread that raised it. Return any JSON-serializable
value — it is serialized into the `content` of the `tool` result message the agent sees.

Two things worth keeping in mind when you write one:

- **Return errors, do not throw them.** A structured `{ error: '...' }` lets the model recover
  and try something else.
- **Ship anything consequential opt-in.** `defaultEnabled: false` keeps a tool out of every run
  until the user turns it on in the tools panel.
