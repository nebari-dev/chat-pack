# Nebari Chat Pack

## Release Process

Docker images for the frontend and backend are published by pushing a `v$SEMVER` tag (e.g., `v1.2.3`). The Helm chart is published by pushing a `chart/v$SEMVER` tag (e.g., `chart/v1.2.3`).

> **Note:** Do not push the app and chart tags at the same time. Each tag triggers the release workflow independently, and if the chart tag arrives first, the chart may reference the previous app version instead of the newly tagged one.
