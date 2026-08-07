ARG NEBI_WORKSPACE="quay.io/reiemp/nebi-chat:latest"
ARG NEBI_INSTALL_ENV_VARS="UV_DYNAMIC_VERSIONING_BYPASS=1.2.3"
FROM quay.io/nebari/nebi-builder:latest AS builder

FROM quay.io/nebari/nebi-runner:latest AS runner
COPY --from=builder /env /env

ENTRYPOINT ["python", "-m", "ravnar", "serve"]
