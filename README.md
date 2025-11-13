This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker

This project includes Docker support for containerized deployments.

### Using Makefile (Recommended)

```bash
# Show all available commands
make help

# Build Docker image
make build

# Start container
make start

# View logs
make logs

# Stop container
make stop

# Clean up (remove container and image)
make clean

# Rebuild from scratch
make rebuild
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Kubernetes / Kind Deployment

This project includes a complete Helm chart for deploying to Kubernetes (optimized for Kind).

### Quick Start with Kind

```bash
# Create cluster and deploy (first time)
make kind-setup

# Or step by step:
# 1. Create Kind cluster
make kind-create

# 2. Deploy application
make kind-deploy

# 3. Access the application
make kind-port-forward
# Then open: http://localhost:8080

# View logs
make kind-logs

# Uninstall
make kind-uninstall

# Delete cluster
make kind-delete
```

### Helm Chart

The Helm chart is located in the `helm/` directory and includes:

- Deployment with configurable replicas
- Service (ClusterIP/NodePort/LoadBalancer)
- Horizontal Pod Autoscaler (optional)
- Configurable resource limits
- Health checks (startup, liveness and readiness probes)
- Security contexts following Pod Security Standards

### CI/CD

The chart is automatically tested on every push using GitHub Actions with Kind:

- **Helm Lint**: Validates chart syntax and best practices
- **Integration Test**: Deploys to Kind cluster and verifies the app responds

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
