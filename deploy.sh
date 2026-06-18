#!/usr/bin/env bash

set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-basil}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-extractkit}"
DEPLOY_BUCKET="${DEPLOY_BUCKET:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"
FRONTEND_CERT_ARN="${FRONTEND_CERT_ARN:-}"
API_CERT_ARN="${API_CERT_ARN:-}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${ROOT_DIR}/infra/cloudformation.yaml"
PROJECT_NAME="${PROJECT_NAME:-${STACK_NAME}}"
DOMAIN_NAME="${DOMAIN_NAME:-extractkit.vberkoz.com}"
API_DOMAIN_NAME="${API_DOMAIN_NAME:-api.extractkit.vberkoz.com}"
BACKEND_DIST_DIR="${ROOT_DIR}/dist/backend"
FRONTEND_DIST_DIR="${ROOT_DIR}/dist/frontend"
ZIP_PATH="${BACKEND_DIST_DIR}/function.zip"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

require_var() {
  local var_name="$1"
  if [ -z "${!var_name}" ]; then
    echo "Missing required variable: ${var_name}" >&2
    exit 1
  fi
}

ensure_dependencies() {
  if [ -x "${ROOT_DIR}/node_modules/.bin/esbuild" ]; then
    log "Dependencies already installed"
    return
  fi

  log "Installing dependencies with npm ci"
  npm ci
}

ensure_deploy_bucket() {
  if aws --profile="${AWS_PROFILE}" s3api head-bucket --bucket "${DEPLOY_BUCKET}" >/dev/null 2>&1; then
    return
  fi

  log "Creating deployment bucket ${DEPLOY_BUCKET}"
  if [ "${AWS_REGION}" = "us-east-1" ]; then
    aws --profile="${AWS_PROFILE}" s3api create-bucket \
      --bucket "${DEPLOY_BUCKET}"
  else
    aws --profile="${AWS_PROFILE}" s3api create-bucket \
      --bucket "${DEPLOY_BUCKET}" \
      --region "${AWS_REGION}" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}"
  fi
}

get_stack_output() {
  local output_key="$1"
  aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue | [0]" \
    --output text
}

cd "${ROOT_DIR}"

require_var HOSTED_ZONE_ID
require_var FRONTEND_CERT_ARN
require_var API_CERT_ARN

ACCOUNT_ID="$(aws --profile="${AWS_PROFILE}" sts get-caller-identity --query Account --output text)"
DEPLOY_BUCKET="${DEPLOY_BUCKET:-${STACK_NAME}-${ACCOUNT_ID}-${AWS_REGION}-deploy}"
LAMBDA_KEY="lambda/${STACK_NAME}-$(date '+%Y%m%d%H%M%S').zip"

ensure_dependencies
ensure_deploy_bucket

log "Building backend with esbuild"
npm run build:backend

log "Zipping backend Lambda"
rm -f "${ZIP_PATH}"
(
  cd "${BACKEND_DIST_DIR}"
  zip -q -j "${ZIP_PATH}" index.js index.js.map
)

log "Building frontend with esbuild"
npm run build:frontend

log "Uploading Lambda zip to s3://${DEPLOY_BUCKET}/${LAMBDA_KEY}"
aws --profile="${AWS_PROFILE}" s3 cp "${ZIP_PATH}" "s3://${DEPLOY_BUCKET}/${LAMBDA_KEY}" \
  --region "${AWS_REGION}"

log "Deploying CloudFormation stack ${STACK_NAME}"
aws --profile="${AWS_PROFILE}" cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}" \
  --region "${AWS_REGION}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    "ProjectName=${PROJECT_NAME}" \
    "CodeS3Bucket=${DEPLOY_BUCKET}" \
    "CodeS3Key=${LAMBDA_KEY}" \
    "HostedZoneId=${HOSTED_ZONE_ID}" \
    "FrontendCertificateArn=${FRONTEND_CERT_ARN}" \
    "ApiCertificateArn=${API_CERT_ARN}" \
    "DomainName=${DOMAIN_NAME}" \
    "ApiDomainName=${API_DOMAIN_NAME}"

FRONTEND_BUCKET="$(get_stack_output FrontendBucketName)"
FRONTEND_DISTRIBUTION_ID="$(get_stack_output FrontendDistributionId)"
FRONTEND_URL="$(get_stack_output FrontendUrl)"
API_URL="$(get_stack_output ApiUrl)"

if [ "${FRONTEND_BUCKET}" = "None" ] || [ -z "${FRONTEND_BUCKET}" ]; then
  echo "Could not resolve FrontendBucketName output from stack ${STACK_NAME}" >&2
  exit 1
fi

if [ "${FRONTEND_DISTRIBUTION_ID}" = "None" ] || [ -z "${FRONTEND_DISTRIBUTION_ID}" ]; then
  echo "Could not resolve FrontendDistributionId output from stack ${STACK_NAME}" >&2
  exit 1
fi

log "Uploading frontend dist to s3://${FRONTEND_BUCKET}"
aws --profile="${AWS_PROFILE}" s3 sync "${FRONTEND_DIST_DIR}/" "s3://${FRONTEND_BUCKET}/" \
  --delete \
  --region "${AWS_REGION}"

log "Invalidating CloudFront distribution ${FRONTEND_DISTRIBUTION_ID}"
aws --profile="${AWS_PROFILE}" cloudfront create-invalidation \
  --distribution-id "${FRONTEND_DISTRIBUTION_ID}" \
  --paths "/*"

log "Deployment complete"
printf 'Frontend URL: %s\n' "${FRONTEND_URL}"
printf 'API URL: %s\n' "${API_URL}"
