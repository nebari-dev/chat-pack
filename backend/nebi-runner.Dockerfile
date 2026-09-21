ARG DISTROLESS_TAG=nonroot
FROM gcr.io/distroless/base-debian13:${DISTROLESS_TAG}

ENV PATH=/env/bin:$PATH
ENV LD_LIBRARY_PATH=/env/lib:$LD_LIBRARY_PATH
