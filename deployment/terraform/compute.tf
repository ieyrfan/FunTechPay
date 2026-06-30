# ==========================================
# 4. COMPUTE & CONTAINERS
# ==========================================

# AWS ECS Cluster (Fargate)
resource "aws_ecs_cluster" "funtechpay_ecs" {
  name = "funtechpay-microservices-ecs"
}

# AWS ECS Fargate Task Definition
resource "aws_ecs_task_definition" "funtechpay_task" {
  family                   = "funtechpay-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([
    {
      name      = "funtechpay-api"
      image     = aws_ecr_repository.funtechpay_frontend.repository_url
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
    }
  ])
}

# EC2 Auto Scaling Group (Worker Nodes)
resource "aws_launch_template" "funtechpay_workers" {
  name_prefix   = "funtechpay-worker"
  image_id      = "ami-0c55b159cbfafe1f0" # AL2
  instance_type = "t3.medium"
}

resource "aws_autoscaling_group" "funtechpay_asg" {
  vpc_zone_identifier = data.aws_subnets.default.ids
  desired_capacity   = 2
  max_size           = 4
  min_size           = 1

  launch_template {
    id      = aws_launch_template.funtechpay_workers.id
    version = "$Latest"
  }
}

# AWS Elastic Beanstalk (Reporting App)
resource "aws_elastic_beanstalk_application" "funtechpay_eb" {
  name        = "funtechpay-reporting"
  description = "FunTechPay Financial Reporting"
}
