.PHONY: help build start stop restart logs clean dev shell rebuild

# Variables
IMAGE_NAME := toolhive-cloud-ui
IMAGE_TAG := latest
CONTAINER_NAME := toolhive-cloud-ui
PORT := 3000

## Show this help message
help:
	@echo "Available commands:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | awk 'NR%2==1{printf "\033[36m%-15s\033[0m ",$$1} NR%2==0{print}'

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

