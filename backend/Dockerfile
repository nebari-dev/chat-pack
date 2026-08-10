ARG NEBI_WORKSPACE="quay.io/reiemp/nebi-chat:latest"
ARG NEBI_INSTALL_ENV_VARS="UV_DYNAMIC_VERSIONING_BYPASS=1.2.3"
FROM quay.io/reiemp/nebi-builder:latest AS builder

FROM quay.io/reiemp/nebi-runner:debug-latest AS runner
COPY --from=builder /env /env
COPY --from=builder /nebi-bundle /nebi-bundle

COPY config-docker.yml /etc/ravnar/config.yml

ENTRYPOINT ["python", "-m", "ravnar", "serve"]
