# Nebari Chat
Nebari Chat is a frontend for a [Ravnar Server](https://github.com/nebari-dev/ravnar) or any
other agentic server that implments the Ravnar API, which is essentially just the
[AG-UI](https://docs.ag-ui.com/introduction) protocol with some additional endpoints for
managing thread history.

# Instructions

Before you can run Nebari Chat you need a [Ravnar](https://github.com/nebari-dev/ravnar)
compatible server running somewhere. Follow the Ravnar instructions for creating your
agents and deploying the server.

To get started with a local version of Nebari Chat, first checkout the repo:

```
git clone https://github.com/nebari-dev/nebari-chat-pack.git
```

Then navigate to the repo and install the dependencies:

```
cd nebari-chat-pack
npm install
```

Then copy the example `env` file and set `VITE_API_URL` to match your Ravnar deployment.

```
cp .env.example .env
```

Nebari Chat uses [KeyCloak](https://www.keycloak.org/) for authentication. Keycloak is configured
via `public/keycloak-config.json`. Edit this file to match your Keycloak deployment before running:

```json
{
  "auth-server-url": "https://keycloak.example.com",
  "realm": "myrealm",
  "resource": "nebari-chat"
}
```

To bypass authentication for local development, set `VITE_AUTH_ENABLED=false` in your `.env`.


# Run the Development Server

Once your `env` file is configured and your Ravnar server is running, start the Nebari Chat
development server with the following command and point your browser at the URL displayed in 
the terminal.

```
npm run dev
```

# Running with Docker

Build the image:

```
docker build -t nebari-chat .
```

Then run the container, passing environment values as needed:

```
docker run -p 8080:8080 -e API_URL=http://host.docker.internal:8000 nebari-chat
```

> **Note:** Keycloak settings are read from `public/keycloak-config.json` at runtime. In a Kubernetes
> deployment, mount a ConfigMap over `/usr/share/nginx/html/keycloak-config.json` to inject the correct
> values without rebuilding the image.

Open your browser at `http://localhost:8080`.

# Publishing to Quay (Manual)

There is no CI/CD pipeline for this project. The Docker image and Helm chart must be built and
pushed manually.

## Docker Image

Build and push the image for `linux/amd64`:

```
docker buildx build --platform linux/amd64 \
  -t quay.io/openteams/chat-plus-plus:<version> \
  -t quay.io/openteams/chat-plus-plus:latest \
  --push .
```

## Helm Chart

Package and push the chart:

```
helm package helm/chat-plus-plus-chart
helm push chat-plus-plus-chart-<version>.tgz oci://quay.io/openteams
```

This publishes to `quay.io/openteams/chat-plus-plus-chart:<version>`. Push to `oci://quay.io/openteams`
(the org level) so the chart name from `Chart.yaml` becomes the repo name.


# Run a Production Build

To build a production bundle for deployment, first make sure your `env` file is configured properly
as these variables will be built into the bundle, then execute the following command:

```
npm run build
```

If the build succeeds, the results will be in the `./dist` directory ready to be hosted by a 
server of your choice.

You can preview the build locally by running the following command and pointing your browser to 
the URL shown in the terminal. This will be a different port than `npm run dev`.

Note that if you change `env` variables, you will need to rebuild the project before the preview
command will pick up the changes.

```
npm run preview
```
