FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# System deps for Node/Hardhat repos, Python services, and sibling linking (rsync)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    jq \
    rsync \
    build-essential \
    default-mysql-client \
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    python3-yaml \
    && rm -rf /var/lib/apt/lists/*

# Shared venv for pre-commit and other Python CLI tools
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# yarn is already in the typescript-node image. Install hardhat globally as root
# (system prefix) with retries — Docker builds often hit npm ECONNRESET otherwise.
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && (npm install -g hardhat \
        || (sleep 5 && npm install -g hardhat) \
        || (sleep 15 && npm install -g hardhat))

USER node

# Official bun installer (do not use the npm "bun" package).
# Download to a file first so a failed curl fails the layer (dash has no pipefail).
RUN (curl -fsSL https://bun.sh/install -o /tmp/install-bun.sh \
        || (sleep 5 && curl -fsSL https://bun.sh/install -o /tmp/install-bun.sh) \
        || (sleep 15 && curl -fsSL https://bun.sh/install -o /tmp/install-bun.sh)) \
    && bash /tmp/install-bun.sh \
    && rm -f /tmp/install-bun.sh \
    && echo 'export BUN_INSTALL="$HOME/.bun"' >> /home/node/.bashrc \
    && echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /home/node/.bashrc

RUN echo 'alias nh="npx hardhat"' >> /home/node/.bashrc \
    && echo 'alias nhc="clear && npx hardhat compile"' >> /home/node/.bashrc \
    && echo 'alias nht="clear && npx hardhat test"' >> /home/node/.bashrc \
    && echo 'alias c="clear"' >> /home/node/.bashrc

WORKDIR /workspaces/pod-architecture
