#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AWS EKS Automated Deployment Script for FleetOps / Odoo
# ==============================================================================

REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${EKS_CLUSTER_NAME:-fleetops-eks-cluster}"

echo "=========================================================="
echo "🚀 FleetOps AWS Deployment"
echo "Region:  $REGION"
echo "Cluster: $CLUSTER_NAME"
echo "=========================================================="

# 1. Verify AWS Authentication
echo "🔍 Checking AWS authentication..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Authenticated as AWS Account: $ACCOUNT_ID"

# 2. Ensure ECR Repositories Exist
echo "📦 Ensuring ECR repositories exist..."
for repo in odoo-backend odoo-frontend; do
  if ! aws ecr describe-repositories --repository-names "$repo" --region "$REGION" >/dev/null 2>&1; then
    echo "Creating ECR repository: $repo..."
    aws ecr create-repository --repository-name "$repo" --region "$REGION" >/dev/null
  else
    echo "Repository $repo exists."
  fi
done

# 3. Authenticate Docker to ECR
echo "🔑 Logging Docker into AWS ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# 4. Build and Push Images
ECR_BACKEND="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/odoo-backend:latest"
ECR_FRONTEND="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/odoo-frontend:latest"

echo "🔨 Building and pushing Backend ($ECR_BACKEND)..."
docker build -t "$ECR_BACKEND" ./backend
docker push "$ECR_BACKEND"

echo "🔨 Building and pushing Frontend ($ECR_FRONTEND)..."
docker build -t "$ECR_FRONTEND" ./frontend
docker push "$ECR_FRONTEND"

# 5. Connect kubectl to EKS Cluster
echo "☸️ Updating kubeconfig for EKS cluster: $CLUSTER_NAME..."
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

# 6. Apply Namespace and Secrets
kubectl apply -f k8s/namespace.yaml

if kubectl get secret odoo-secrets -n odoo-app >/dev/null 2>&1; then
  echo "✅ Secret 'odoo-secrets' already present in odoo-app namespace."
else
  echo "⚠️ Warning: 'odoo-secrets' not found. Please create it using k8s/secrets.template.yaml"
fi

# 7. Run Database Migrations Job
echo "🔄 Running Prisma Database Migration Job..."
# Render image dynamically for migration job
sed "s|image: odoo-backend:latest|image: $ECR_BACKEND|g" k8s/migration-job.yaml | kubectl apply -f -
kubectl wait --for=condition=complete job/odoo-db-migrate -n odoo-app --timeout=120s || true

# 8. Deploy Backend, Frontend, and Monitoring
echo "🚀 Deploying Backend with image $ECR_BACKEND..."
sed "s|image: odoo-backend:latest|image: $ECR_BACKEND|g" k8s/backend.yaml | kubectl apply -f -

echo "🚀 Deploying Frontend with image $ECR_FRONTEND..."
sed "s|image: odoo-frontend:latest|image: $ECR_FRONTEND|g" k8s/frontend.yaml | kubectl apply -f -

echo "📊 Deploying Prometheus & Grafana stack..."
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml

# 9. Deploy Ingress (ALB)
echo "🌐 Applying AWS Ingress..."
kubectl apply -f k8s/aws-ingress.yaml

echo "=========================================================="
echo "🎉 Deployment initiated! Run the following to monitor:"
echo "kubectl get pods -n odoo-app"
echo "kubectl get ingress odoo-ingress -n odoo-app"
echo "=========================================================="
