#!/usr/bin/env bash
# ============================================================
# Truth Archive — Autopilot AWS Infrastructure Setup
#
# Run once from your local machine with AWS CLI configured.
# Prerequisites: aws-cli v2, jq, zip, node 20+
#
# Usage:
#   cd autopilot
#   chmod +x infra/setup.sh
#   ./infra/setup.sh
# ============================================================

set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="ta-autopilot"
FUNCTION_NAME="ta-daily-topic"
ROLE_NAME="ta-autopilot-role"
RULE_NAME="ta-daily-publish"
# Publish at 09:00 UTC every day
SCHEDULE="cron(0 9 * * ? *)"

echo "=== Truth Archive Autopilot Setup ==="
echo "Account: $ACCOUNT_ID  Region: $REGION"
echo ""

# ── 1. S3 bucket for topic queue ───────────────────────────────────────────────
echo "[1/7] Creating S3 bucket: $BUCKET"
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || echo "  Bucket already exists, continuing."

aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

# Upload the initial topic queue
echo "  Uploading topic-queue.json..."
aws s3 cp ../topic-queue.json "s3://$BUCKET/topic-queue.json" --content-type application/json
echo "  Done."

# ── 2. IAM role for Lambda ─────────────────────────────────────────────────────
echo "[2/7] Creating IAM role: $ROLE_NAME"
TRUST=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF
)

ROLE_ARN=$(aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "$TRUST" \
  --query 'Role.Arn' --output text 2>/dev/null) || \
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo "  Role ARN: $ROLE_ARN"

# Attach policies
aws iam attach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Inline policy for S3 + SSM
POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:PutObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter"],
      "Resource": "arn:aws:ssm:$REGION:$ACCOUNT_ID:parameter/ta/*"
    }
  ]
}
EOF
)
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "ta-autopilot-inline" \
  --policy-document "$POLICY"

echo "  Policies attached."
sleep 5  # IAM propagation

# ── 3. Build Lambda zip ────────────────────────────────────────────────────────
echo "[3/7] Building Lambda deployment zip"
cd ..
npm install --omit=dev --prefix lambda-build > /dev/null 2>&1 || npm install --prefix lambda-build > /dev/null 2>&1
cp lambda/*.mjs lambda-build/
(cd lambda-build && zip -r ../lambda.zip . -x "*.zip") > /dev/null
echo "  lambda.zip created ($(du -sh lambda.zip | cut -f1))"
cd infra

# ── 4. Create Lambda function ──────────────────────────────────────────────────
echo "[4/7] Creating Lambda function: $FUNCTION_NAME"
EXISTING=$(aws lambda get-function --function-name "$FUNCTION_NAME" 2>/dev/null && echo "yes" || echo "no")

if [ "$EXISTING" = "yes" ]; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://../lambda.zip \
    --no-cli-pager
  echo "  Function code updated."
else
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --handler index.handler \
    --role "$ROLE_ARN" \
    --zip-file fileb://../lambda.zip \
    --timeout 120 \
    --memory-size 256 \
    --environment "Variables={QUEUE_BUCKET=$BUCKET}" \
    --no-cli-pager
  echo "  Function created."
fi

LAMBDA_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" \
  --query 'Configuration.FunctionArn' --output text)

# ── 5. EventBridge rule ────────────────────────────────────────────────────────
echo "[5/7] Creating EventBridge rule: $RULE_NAME ($SCHEDULE)"
RULE_ARN=$(aws events put-rule \
  --name "$RULE_NAME" \
  --schedule-expression "$SCHEDULE" \
  --state ENABLED \
  --query 'RuleArn' --output text)

aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id eventbridge-daily \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "$RULE_ARN" 2>/dev/null || echo "  Permission already exists."

aws events put-targets \
  --rule "$RULE_NAME" \
  --targets "Id=1,Arn=$LAMBDA_ARN"
echo "  EventBridge rule set."

# ── 6. SSM parameters (prompts) ───────────────────────────────────────────────
echo "[6/7] Setting up SSM Parameter Store secrets"
echo ""
echo "  You need to add these four secrets manually (they contain sensitive data):"
echo "  Run each of the following commands, substituting your real values:"
echo ""
echo "  aws ssm put-parameter --name '/ta/openai-api-key' --value 'sk-...' --type SecureString"
echo "  aws ssm put-parameter --name '/ta/vps-host'       --value '100.50.29.179' --type String"
echo "  aws ssm put-parameter --name '/ta/vps-user'       --value 'ubuntu' --type String"
echo "  aws ssm put-parameter --name '/ta/vps-webroot'    --value '/var/www/truth-archive' --type String"
echo "  aws ssm put-parameter --name '/ta/vps-ssh-key'    --value file://~/.ssh/trutharchive.pem --type SecureString"
echo ""
echo "  NOTE: For the SSH key use:"
echo "  aws ssm put-parameter --name '/ta/vps-ssh-key' \\"
echo "    --value \"\$(cat ~/.ssh/trutharchive.pem)\" --type SecureString"

# ── 7. Done ────────────────────────────────────────────────────────────────────
echo ""
echo "[7/7] Setup complete!"
echo ""
echo "  Lambda:      $LAMBDA_ARN"
echo "  EventBridge: $RULE_ARN  (fires daily at 09:00 UTC)"
echo "  Queue:       s3://$BUCKET/topic-queue.json  (${#} topics loaded)"
echo ""
echo "  To test immediately:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME /tmp/out.json && cat /tmp/out.json"
echo ""
echo "  To add more topics, edit autopilot/topic-queue.json and re-upload:"
echo "  aws s3 cp autopilot/topic-queue.json s3://$BUCKET/topic-queue.json"
