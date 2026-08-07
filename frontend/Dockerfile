ARG NEBI_WORKSPACE="quay.io/reiemp/nebi-chat-frontend:latest"
FROM quay.io/reiemp/nebi-builder:latest AS builder

FROM quay.io/reiemp/nebi-runner:debug-latest AS runner
COPY --from=builder /env /env
COPY --from=builder /nebi-bundle /nebi-bundle

ENTRYPOINT ["/env/sbin/nginx", "-c", "/nebi-bundle/nebi-bundle/nginx.conf.rendered", "-g", "daemon off;"]
