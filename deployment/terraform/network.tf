# ==========================================
# 1. NETWORKING & TRAFFIC ROUTING
# ==========================================

# Default VPC for Learner Lab Compatibility
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# AWS App Mesh (Service Mesh for microservices)
resource "aws_appmesh_mesh" "funtechpay_mesh" {
  name = "funtechpay-microservices-mesh"
  spec {
    egress_filter {
      type = "ALLOW_ALL"
    }
  }
}

# Application Load Balancer (ELB)
resource "aws_lb" "funtechpay_alb" {
  name               = "funtechpay-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [] # SG to be added
  subnets            = data.aws_subnets.default.ids
}

# API Gateway (Entry point)
resource "aws_apigatewayv2_api" "funtechpay_api" {
  name          = "funtechpay-gateway"
  protocol_type = "HTTP"
}
