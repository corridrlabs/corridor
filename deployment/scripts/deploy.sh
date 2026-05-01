#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
VERSION=${VERSION:-$(git rev-parse --short HEAD)}

echo "🚀 Deploying Corridor to $ENVIRONMENT environment"
echo "📦 Version: $VERSION"

# Build and push images
echo "🔨 Building Docker images..."
docker build -t $DOCKER_REGISTRY/corridor-api:$VERSION .
docker build -t $DOCKER_REGISTRY/corridor-frontend:$VERSION ./frontend

echo "📤 Pushing images to registry..."
docker push $DOCKER_REGISTRY/corridor-api:$VERSION
docker push $DOCKER_REGISTRY/corridor-frontend:$VERSION

# Deploy to Kubernetes
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🎯 Deploying to production..."
    kubectl config use-context production
    
    # Update image tags in deployment files
    sed -i "s|image: corridor/api:latest|image: $DOCKER_REGISTRY/corridor-api:$VERSION|g" deployment/kubernetes/api-deployment.yaml
    sed -i "s|image: corridor/frontend:latest|image: $DOCKER_REGISTRY/corridor-frontend:$VERSION|g" deployment/kubernetes/frontend-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f deployment/kubernetes/
    
    # Wait for rollout
    kubectl rollout status deployment/corridor-api
    kubectl rollout status deployment/corridor-frontend
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Deploying to staging..."
    kubectl config use-context staging
    
    # Update image tags
    sed -i "s|image: corridor/api:latest|image: $DOCKER_REGISTRY/corridor-api:$VERSION|g" deployment/kubernetes/api-deployment.yaml
    sed -i "s|image: corridor/frontend:latest|image: $DOCKER_REGISTRY/corridor-frontend:$VERSION|g" deployment/kubernetes/frontend-deployment.yaml
    
    # Apply manifests
    kubectl apply -f deployment/kubernetes/
    
    # Wait for rollout
    kubectl rollout status deployment/corridor-api
    kubectl rollout status deployment/corridor-frontend
else
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo "🔗 Application URL: https://app.corridor.com"