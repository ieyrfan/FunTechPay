# ==========================================
# 5. SERVERLESS & MESSAGING
# ==========================================

# AWS Lambda (Core API Logic)
resource "aws_lambda_function" "funtechpay_auth" {
  filename      = "dummy_lambda.zip" # Requires a dummy zip in same directory
  function_name = "funtechpay-auth-lambda"
  role          = data.aws_iam_role.lab_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
}

# Amazon SNS (Notifications)
resource "aws_sns_topic" "funtechpay_alerts" {
  name = "funtechpay-security-alerts"
}

# Amazon SQS (Transaction Queues)
resource "aws_sqs_queue" "funtechpay_transactions" {
  name = "funtechpay-transaction-queue"
}

# Amazon EventBridge (Scheduled Audits)
resource "aws_cloudwatch_event_rule" "funtechpay_nightly_audit" {
  name                = "funtechpay-nightly-audit"
  schedule_expression = "rate(1 day)"
}

# AWS Step Functions (Workflow Orchestration)
resource "aws_sfn_state_machine" "funtechpay_kyc_workflow" {
  name     = "funtechpay-kyc-workflow"
  role_arn = data.aws_iam_role.lab_role.arn

  definition = <<EOF
{
  "Comment": "FunTechPay KYC AI Workflow",
  "StartAt": "PassState",
  "States": {
    "PassState": {
      "Type": "Pass",
      "Result": "Hello",
      "End": true
    }
  }
}
EOF
}
