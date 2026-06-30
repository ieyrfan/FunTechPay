# AegisPay Production Deployment Script (PowerShell)
# This script will build the Docker image, push it to ECR, deploy EKS via Terraform, and apply the Kubernetes manifests.

Write-Host "================================================="
Write-Host "🚀 STARTING AEGISPAY PRODUCTION DEPLOYMENT 🚀"
Write-Host "================================================="

# 1. Terraform Apply (Deploy ECR & EKS)
Write-Host "Step 1: Provisioning AWS ECR and EKS Cluster..."
cd .\deployment\terraform
terraform init
terraform apply -auto-approve

# Get ECR URL from Terraform Output
$ECR_URL = terraform output -raw ecr_repository_url
$EKS_CLUSTER_NAME = terraform output -raw eks_cluster_name
cd ..\..

# 2. Build Docker Image
Write-Host "Step 2: Building AegisPay Docker Image..."
cd .\frontend
docker build -t aegispay-frontend:latest .

# 3. Push to Amazon ECR
Write-Host "Step 3: Authenticating and Pushing to Amazon ECR..."
$REGION = "us-east-1"
$ACCOUNT_ID = $ECR_URL.Split('.')[0]

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URL
docker tag aegispay-frontend:latest "$($ECR_URL):latest"
docker push "$($ECR_URL):latest"
cd ..

# 4. Update kubeconfig
Write-Host "Step 4: Connecting to Amazon EKS Cluster..."
aws eks update-kubeconfig --region $REGION --name $EKS_CLUSTER_NAME

# 5. Apply Kubernetes Manifests
Write-Host "Step 5: Deploying to Kubernetes..."
# Replace placeholder ECR URL in deployment.yaml
(Get-Content .\deployment\k8s\deployment.yaml) -replace '<ECR_URL>', $ECR_URL | Set-Content .\deployment\k8s\deployment.yaml
kubectl apply -f .\deployment\k8s\deployment.yaml

Write-Host "================================================="
Write-Host "✅ DEPLOYMENT COMPLETE! Waiting for Load Balancer..."
Write-Host "Run 'kubectl get svc' to get the public URL."
Write-Host "================================================="
