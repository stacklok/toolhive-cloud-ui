# OIDC Mock Provider for Development
# Pinned to Alpine 3.24.1 which ships libcrypto3/libssl3 3.5.7-r0, fixing the June 9 2026
# OpenSSL advisory (CVE-2026-34180..34183, CVE-2026-42764, CVE-2026-42766..42770,
# CVE-2026-45445..45447, CVE-2026-7383, CVE-2026-9076). See:
# https://alpinelinux.org/posts/Alpine-3.24.1-released.html
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

WORKDIR /app

# Install oidc-provider and dotenv
RUN npm init -y && npm install oidc-provider dotenv

# Copy the OIDC provider script
COPY oidc-provider.mjs ./

# Run as non-root user (node user is available in node:alpine images)
USER node

EXPOSE 4000

CMD ["node", "oidc-provider.mjs"]
