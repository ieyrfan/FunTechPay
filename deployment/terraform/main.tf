provider "aws" {
  region = "us-east-1"
}

# 1. ECR Repository for FunTechPay Frontend
resource "aws_ecr_repository" "funtechpay_frontend" {
  name                 = "funtechpay-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 2. Amazon EKS Cluster (Strictly using LabEksClusterRole)
data "aws_iam_role" "lab_eks_role" {
  name = "LabEksClusterRole"
}

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Use Default VPC for Lab Simplicity
data "aws_vpc" "default" {
  default = true
}
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_eks_cluster" "funtechpay_cluster" {
  name     = "funtechpay-core-cluster"
  role_arn = data.aws_iam_role.lab_eks_role.arn

  vpc_config {
    subnet_ids = data.aws_subnets.default.ids
  }
}

# 3. EKS Node Group
resource "aws_eks_node_group" "funtechpay_nodes" {
  cluster_name    = aws_eks_cluster.funtechpay_cluster.name
  node_group_name = "funtechpay-node-group"
  node_role_arn   = data.aws_iam_role.lab_role.arn
  subnet_ids      = data.aws_subnets.default.ids

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  depends_on = [
    aws_eks_cluster.funtechpay_cluster
  ]
}

# 4. GuardDuty & Security Hub (Cybersecurity Foundations)
resource "aws_guardduty_detector" "funtechpay_gd" {
  enable = true
}

output "ecr_repository_url" {
  value = aws_ecr_repository.funtechpay_frontend.repository_url
}
output "eks_cluster_name" {
  value = aws_eks_cluster.funtechpay_cluster.name
}
output "eks_cluster_endpoint" {
  value = aws_eks_cluster.funtechpay_cluster.endpoint
}
