# ==========================================
# 3. DATABASES & MEMORY
# ==========================================

# Amazon DynamoDB (Session & NoSQL Data)
resource "aws_dynamodb_table" "funtechpay_sessions" {
  name           = "FunTechPay-Sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "SessionId"

  attribute {
    name = "SessionId"
    type = "S"
  }
  
  point_in_time_recovery {
    enabled = true
  }
}

# Amazon RDS (Aurora/MySQL)
resource "aws_db_instance" "funtechpay_db" {
  identifier           = "funtechpay-core-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  username             = "admin"
  password             = "DummyPass123!" # In real env, use Secrets Manager
  skip_final_snapshot  = true
  publicly_accessible  = false
}

# Amazon ElastiCache (Redis)
resource "aws_elasticache_cluster" "funtechpay_cache" {
  cluster_id           = "funtechpay-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# Amazon Redshift (Data Warehouse for Analytics)
resource "aws_redshift_cluster" "funtechpay_dw" {
  cluster_identifier = "funtechpay-data-warehouse"
  database_name      = "funtechpaydb"
  master_username    = "awsuser"
  master_password    = "FunTechPay2026!"
  node_type          = "ra3.large"
  cluster_type       = "single-node"
  skip_final_snapshot = true
}
