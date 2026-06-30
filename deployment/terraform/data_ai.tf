# ==========================================
# 6. STORAGE, ANALYTICS & MACHINE LEARNING
# ==========================================

# Amazon S3 (Core Storage)
resource "aws_s3_bucket" "funtechpay_data" {
  bucket = "funtechpay-core-data-lake-2026"
}

resource "aws_s3_bucket" "audit_logs" {
  bucket = "funtechpay-audit-logs-2026"
}

# Amazon EFS (Elastic File System)
resource "aws_efs_file_system" "funtechpay_efs" {
  creation_token = "funtechpay-efs"
  encrypted      = true
}

# AWS Backup (Automated Backups)
resource "aws_backup_vault" "funtechpay_vault" {
  name = "funtechpay-backup-vault"
}

# Amazon Kinesis (Real-time Stream)
resource "aws_kinesis_stream" "funtechpay_tx_stream" {
  name             = "funtechpay-transaction-stream"
  shard_count      = 1
  retention_period = 24
}

# Amazon Athena (Querying Logs in S3)
resource "aws_athena_workgroup" "funtechpay_athena" {
  name = "funtechpay-athena-wg"
}

# Amazon SageMaker (Fraud Detection)
resource "aws_sagemaker_notebook_instance" "funtechpay_ml" {
  name          = "funtechpay-fraud-model"
  role_arn      = data.aws_iam_role.lab_role.arn
  instance_type = "ml.t2.medium"
}

# (Note: Rekognition and Textract are API-driven services and do not require provisioning via Terraform. 
# They are invoked directly via Boto3 in the backend orchestrator).
