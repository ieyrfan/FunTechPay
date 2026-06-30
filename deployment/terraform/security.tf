# ==========================================
# 2. CYBERSECURITY & COMPLIANCE
# ==========================================

# AWS WAFv2 (Web Application Firewall)
resource "aws_wafv2_web_acl" "funtechpay_waf" {
  name        = "funtechpay-waf"
  description = "Block SQLi and malicious IPs"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "funtechpayWafMetric"
    sampled_requests_enabled   = true
  }
}

# Amazon GuardDuty (Threat Detection)
resource "aws_guardduty_detector" "funtechpay_gd" {
  enable = true
}

# AWS Security Hub (Central Security Console)
# resource "aws_securityhub_account" "funtechpay_hub" {} # Might require special lab permissions

# AWS KMS (Key Management Service for Encryption)
resource "aws_kms_key" "funtechpay_key" {
  description             = "KMS key for FunTechPay data encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

# AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "funtechpay/db/password"
}

# AWS Inspector (Vulnerability Scanning)
resource "aws_inspector_resource_group" "funtechpay_inspector" {
  tags = {
    Name = "FunTechPay-Resources"
  }
}

# AWS Config (Configuration Auditing)
resource "aws_config_configuration_recorder" "funtechpay_config" {
  name     = "funtechpay-recorder"
  role_arn = data.aws_iam_role.lab_role.arn
}

# AWS CloudTrail (Audit Trail)
resource "aws_cloudtrail" "funtechpay_trail" {
  name                          = "funtechpay-audit-trail"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
}
