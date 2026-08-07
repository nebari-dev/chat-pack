FROM ghcr.io/prefix-dev/pixi:0.72.1

RUN pixi global install nebi=0.13

WORKDIR /workspace
ONBUILD ARG NEBI_WORKSPACE
ONBUILD RUN nebi import ${NEBI_WORKSPACE}

ONBUILD RUN mkdir /nebi-bundle && cp --recursive ./* /nebi-bundle && chmod --recursive a+rX /nebi-bundle

ONBUILD ARG NEBI_INSTALL_ENV_VARS
ONBUILD RUN export ${NEBI_INSTALL_ENV_VARS:-NEBI_BUILDER_NO_INSTALL_ENV_VARS=1} && pixi install
ONBUILD RUN mv .pixi/envs/default /env && chmod --recursive a+rX /env
