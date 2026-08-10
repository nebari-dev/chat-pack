ARG NEBI_WORKSPACE="quay.io/reiemp/nebi-chat-frontend:latest"
FROM quay.io/reiemp/nebi-builder:latest AS builder

FROM quay.io/reiemp/nebi-runner:debug-latest AS runner
COPY --from=builder /env /env
COPY --from=builder /nebi-bundle /nebi-bundle
COPY f3 /f3

WORKDIR /tmp/nginx
WORKDIR /

ENTRYPOINT [ \
  "/f3", \
  "/nebi-bundle/config.json.tpl:/nebi-bundle/dist/config.json", \
  "/nebi-bundle/nginx.conf.tpl:/tmp/nginx/nginx.conf", \
  "--", \
  "/env/sbin/nginx", "-e", "/tmp/nginx/error.log", "-p", "/env", "-c", "/tmp/nginx/nginx.conf", "-g", "daemon off;" \
]
