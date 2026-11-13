FROM node:24-bookworm-slim

ARG CODEX_VERSION=0.166.0
RUN npm install --global @openai/codex@${CODEX_VERSION} \
    @openai/codex-linux-x64@npm:@openai/codex@${CODEX_VERSION}-linux-x64 \
    && groupadd --gid 10001 codex \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin codex \
    && mkdir -p /workspace /home/codex/.codex /tmp/codex \
    && chown -R codex:codex /workspace /home/codex /tmp/codex

ENV HOME=/home/codex \
    CODEX_HOME=/home/codex/.codex \
    TMPDIR=/tmp/codex
USER 10001:10001
WORKDIR /workspace
ENTRYPOINT ["codex"]
