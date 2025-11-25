.PHONY: help build start stop restart logs clean dev shell rebuild install lint format test type-check generate-client dev-mock-server dev-mock-oidc

# Variables
IMAGE_NAME := toolhive-cloud-ui
IMAGE_TAG := latest
CONTAINER_NAME := toolhive-cloud-ui
PORT := 3000
RELEASE_NAME := toolhive-cloud-ui

## Show this help message
help:
	@echo "ToolHive Cloud UI - Available Commands"
	@echo ""
	@echo "Development (pnpm):"
	@echo "  make install        - Install dependencies (pnpm install)"
	@echo "  make dev            - Run dev server with OIDC mock and MSW"
	@echo "  make dev-next       - Run only Next.js dev server"
	@echo "  make dev-mock-server - Run Next.js with MSW (requires real OIDC)"
	@echo "  make dev-mock-oidc  - Run Next.js with OIDC mock (requires real API)"
	@echo "  make lint           - Run linter (Biome)"
	@echo "  make format         - Format code (Biome)"
	@echo "  make test           - Run tests (Vitest)"
	@echo "  make type-check     - TypeScript type checking"
	@echo "  make generate-client - Generate API client from backend"
	@echo ""
	@echo "Docker (Production):"
	@echo "  make build          - Build production Docker image"
	@echo "  make start          - Start Docker container"
	@echo "  make stop           - Stop Docker container"
	@echo "  make logs           - View container logs"
	@echo "  make clean          - Remove container and image"
	@echo "  make rebuild        - Clean and rebuild"
	@echo ""
	@echo "Kind (Kubernetes):"
	@echo "  make kind-setup     - Create cluster and deploy (first time)"
	@echo "  make kind-create    - Create Kind cluster"
	@echo "  make kind-deploy    - Build and deploy to Kind"
	@echo "  make kind-port-forward - Port-forward to localhost:8080"
	@echo "  make kind-logs      - View application logs"
	@echo "  make kind-uninstall - Uninstall from Kind"
	@echo "  make kind-delete    - Delete Kind cluster"

## Build the production docker image
build:
	@echo "Building ${IMAGE_NAME}:${IMAGE_TAG} Docker image..."
	@docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

## Start the production docker container
start:
	@docker run -d -p $(PORT):$(PORT) --name $(CONTAINER_NAME) $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Container $(CONTAINER_NAME) running at http://localhost:$(PORT)"

## Stop the production docker container
stop:
	@docker stop $(CONTAINER_NAME) > /dev/null 2>&1 || true
	@docker rm $(CONTAINER_NAME) > /dev/null 2>&1 || true
	@echo "Container $(CONTAINER_NAME) stopped"

## Restart the production docker container
restart: stop start

## Show container logs (follow mode)
logs:
	docker logs -f $(CONTAINER_NAME)

## Remove container and image
clean: stop
	@docker rmi $(IMAGE_NAME):$(IMAGE_TAG) > /dev/null 2>&1 || true
	@echo "Cleanup complete"

## Install dependencies
install:
	@echo "Installing dependencies with pnpm..."
	@pnpm install

## Run development server with OIDC mock and MSW mock server
dev:
	@echo "Starting dev server (Next.js + OIDC + MSW)..."
	@pnpm dev

## Run only Next.js dev server
dev-next:
	@echo "Starting Next.js dev server only..."
	@pnpm dev:next

## Run Next.js with MSW mock server (requires real OIDC configured)
dev-mock-server:
	@echo "Starting Next.js with MSW mock server (requires OIDC in .env.local)..."
	@pnpm dev:mock-server

## Run Next.js with OIDC mock (requires real backend API configured)
dev-mock-oidc:
	@echo "Starting Next.js with OIDC mock (requires API_BASE_URL in .env.local)..."
	@pnpm dev:mock-oidc

## Run linter
lint:
	@echo "Running linter..."
	@pnpm lint

## Format code
format:
	@echo "Formatting code..."
	@pnpm format

## Run tests
test:
	@echo "Running tests..."
	@pnpm test

## TypeScript type checking
type-check:
	@echo "Type checking..."
	@pnpm type-check

## Generate API client from backend
generate-client:
	@echo "Generating API client..."
	@pnpm generate-client

## Open shell in running container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

## Clean and rebuild image
rebuild: clean build
	@echo "Rebuild complete"

## Create Kind cluster
kind-create:
	@echo "Creating Kind cluster..."
	@kind create cluster --name toolhive || echo "Cluster already exists"
	@kubectl cluster-info --context kind-toolhive
	@echo "Kind cluster ready!"

## Delete Kind cluster
kind-delete:
	@echo "Deleting Kind cluster..."
	@kind delete cluster --name toolhive
	@echo "Cluster deleted"

## Build and load image into Kind
kind-build:
	@echo "Building Docker image..."
	@docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "Loading image into Kind cluster..."
	@kind load docker-image $(IMAGE_NAME):$(IMAGE_TAG) --name toolhive
	@echo "Image loaded successfully"

## Deploy to Kind with Helm
kind-deploy: kind-build
	@echo "Deploying to Kind..."
	@helm upgrade --install $(RELEASE_NAME) ./helm -f ./helm/values-dev.yaml --wait --timeout=5m
	@echo "Deployment complete!"
	@echo ""
	@echo "To access the application, run:"
	@echo "  make kind-port-forward"
	@echo "Then open: http://localhost:8080"

## Uninstall from Kind
kind-uninstall:
	@helm uninstall $(RELEASE_NAME) || true
	@echo "Uninstalled from Kind"

## View logs
kind-logs:
	@kubectl logs -f deployment/$(RELEASE_NAME)

## Port-forward to localhost
kind-port-forward:
	@echo "Forwarding to http://localhost:8080"
	@kubectl port-forward svc/$(RELEASE_NAME) 8080:80

## Full setup: create cluster and deploy
kind-setup: kind-create kind-deploy
	@echo "Setup complete!"

