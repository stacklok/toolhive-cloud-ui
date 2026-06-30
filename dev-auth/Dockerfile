# OIDC Mock Provider for Development
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

WORKDIR /app

# Install oidc-provider and dotenv
RUN npm init -y && npm install oidc-provider dotenv

# Copy the OIDC provider script
COPY oidc-provider.mjs ./

# Run as non-root user (node user is available in node:alpine images)
USER node

EXPOSE 4000

CMD ["node", "oidc-provider.mjs"]
