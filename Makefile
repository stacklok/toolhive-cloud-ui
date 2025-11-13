.PHONY: help build start stop restart logs clean dev shell rebuild

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
	@echo "Docker (Local Development):"
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
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Run Next.js dev server"

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

## Run development server locally
dev:
	pnpm dev

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

