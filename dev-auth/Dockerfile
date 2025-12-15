# OIDC Mock Provider for Development
FROM node:24-alpine

WORKDIR /app

# Install oidc-provider and dotenv
RUN npm init -y && npm install oidc-provider dotenv

# Copy the OIDC provider script
COPY oidc-provider.mjs ./

EXPOSE 4000

CMD ["node", "oidc-provider.mjs"]

