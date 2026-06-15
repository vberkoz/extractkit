#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_NAME="${STACK_NAME:-extractkit}"
PROJECT_NAME="${PROJECT_NAME:-extractkit}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-basil}"

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

aws --profile="${AWS_PROFILE}" cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${ROOT_DIR}/infra/template.yaml" \
  --region "${AWS_REGION}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    "ProjectName=${PROJECT_NAME}" \
    "CodeS3Bucket=${ARTIFACT_BUCKET}" \
    "CodeS3Key=${ARTIFACT_KEY}"

FRONTEND_BUCKET="$(
  aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text
)"

aws --profile="${AWS_PROFILE}" s3 sync "${FRONTEND_DIST_DIR}/" "s3://${FRONTEND_BUCKET}/" --delete --region "${AWS_REGION}"

echo "Frontend bucket: ${FRONTEND_BUCKET}"
aws --profile="${AWS_PROFILE}" cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table
