#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_NAME="${STACK_NAME:-extractkit}"
PROJECT_NAME="${PROJECT_NAME:-extractkit}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-basil}"
TEMPLATE_FILE="${TEMPLATE_FILE:-${ROOT_DIR}/infra/cloudformation.yaml}"
DOMAIN_NAME="${DOMAIN_NAME:-extractkit.vberkoz.com}"
API_DOMAIN_NAME="${API_DOMAIN_NAME:-api.extractkit.vberkoz.com}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"
FRONTEND_CERTIFICATE_ARN="${FRONTEND_CERTIFICATE_ARN:-}"
API_CERTIFICATE_ARN="${API_CERTIFICATE_ARN:-}"

ACCOUNT_ID="$(aws --profile="${AWS_PROFILE}" sts get-caller-identity --query Account --output text)"
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:-${STACK_NAME}-${ACCOUNT_ID}-${AWS_REGION}-artifacts}"
ARTIFACT_KEY="lambda/$(date +%Y%m%d%H%M%S).zip"
BACKEND_DIST_DIR="${ROOT_DIR}/dist/backend"
FRONTEND_DIST_DIR="${ROOT_DIR}/dist/frontend"
ZIP_PATH="${BACKEND_DIST_DIR}/function.zip"

cd "${ROOT_DIR}"

npm run build

if ! aws --profile="${AWS_PROFILE}" s3api head-bucket --bucket "${ARTIFACT_BUCKET}" >/dev/null 2>&1; then
  if [ "${AWS_REGION}" = "us-east-1" ]; then
    aws --profile="${AWS_PROFILE}" s3api create-bucket --bucket "${ARTIFACT_BUCKET}"
  else
    aws --profile="${AWS_PROFILE}" s3api create-bucket \
      --bucket "${ARTIFACT_BUCKET}" \
      --region "${AWS_REGION}" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}"
  fi
fi

rm -f "${ZIP_PATH}"
(
  cd "${BACKEND_DIST_DIR}"
  zip -q -j "${ZIP_PATH}" index.js index.js.map
)

aws --profile="${AWS_PROFILE}" s3 cp "${ZIP_PATH}" "s3://${ARTIFACT_BUCKET}/${ARTIFACT_KEY}" --region "${AWS_REGION}"

if [ ! -f "${TEMPLATE_FILE}" ]; then
  echo "Template file not found: ${TEMPLATE_FILE}" >&2
  exit 1
fi

if [ "${TEMPLATE_FILE}" = "${ROOT_DIR}/infra/cloudformation.yaml" ]; then
  for required_var in HOSTED_ZONE_ID FRONTEND_CERTIFICATE_ARN API_CERTIFICATE_ARN; do
    if [ -z "${!required_var}" ]; then
      echo "Missing required environment variable for production template: ${required_var}" >&2
      exit 1
    fi
  done
fi

PARAMETER_OVERRIDES=(
  "ProjectName=${PROJECT_NAME}"
  "CodeS3Bucket=${ARTIFACT_BUCKET}"
  "CodeS3Key=${ARTIFACT_KEY}"
)

if [ "${TEMPLATE_FILE}" = "${ROOT_DIR}/infra/cloudformation.yaml" ]; then
  PARAMETER_OVERRIDES+=(
    "DomainName=${DOMAIN_NAME}"
    "ApiDomainName=${API_DOMAIN_NAME}"
    "HostedZoneId=${HOSTED_ZONE_ID}"
    "FrontendCertificateArn=${FRONTEND_CERTIFICATE_ARN}"
    "ApiCertificateArn=${API_CERTIFICATE_ARN}"
  )
fi

aws --profile="${AWS_PROFILE}" cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}" \
  --region "${AWS_REGION}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "${PARAMETER_OVERRIDES[@]}"

FRONTEND_BUCKET="$(
  aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text
)"

aws --profile="${AWS_PROFILE}" s3 sync "${FRONTEND_DIST_DIR}/" "s3://${FRONTEND_BUCKET}/" --delete --region "${AWS_REGION}"

API_BASE_URL="$(
  aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue | [0]" \
    --output text
)"

if [ "${API_BASE_URL}" = "None" ] || [ -z "${API_BASE_URL}" ]; then
  API_BASE_URL="$(
    aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
      --stack-name "${STACK_NAME}" \
      --region "${AWS_REGION}" \
      --query "Stacks[0].Outputs[?OutputKey=='BackendFunctionUrl'].OutputValue | [0]" \
      --output text
  )"
fi

echo "Frontend bucket: ${FRONTEND_BUCKET}"
echo "API base URL: ${API_BASE_URL}"
aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table
