# OIDC Mock Provider for Development
FROM node:24-alpine

WORKDIR /app

# Install oidc-provider and dotenv
RUN npm init -y && npm install oidc-provider dotenv

# Copy the OIDC provider script
COPY oidc-provider.mjs ./

# Run as non-root user (node user is available in node:alpine images)
USER node

EXPOSE 4000

CMD ["node", "oidc-provider.mjs"]
