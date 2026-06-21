# ExtractKit

ExtractKit is a small TypeScript monorepo for a document and content extraction product. It includes:

- a plain HTML/CSS/TypeScript frontend demo client
- an AWS Lambda backend behind API Gateway
- CloudFormation infrastructure for frontend hosting, API hosting, DNS, storage, and data
- scripts for local builds, deployment, smoke tests, and API key creation

## Project Overview

The current repo is intentionally compact and centered around one backend Lambda entrypoint.

Today it supports:

- `POST /v1/extract` for schema-based text extraction
- `POST /v1/extract-url` for fetch-and-extract from a web page
- `POST /v1/extract-pdf` for PDF text extraction plus schema-based extraction
- `GET /v1/jobs/{jobId}` for reading stored job status and results
- `GET /v1/usage` for current-month usage lookup
- a frontend for trying the API without leaving the browser

Current implementation notes:

- extraction now uses Amazon Bedrock with Amazon Nova Micro only, and accepts nested JSON-schema-like request shapes for model-guided extraction
- PDF extraction now fetches the PDF, prefers embedded text when it is usable, selectively OCRs weak/scanned pages with Textract, and sends the merged text to Amazon Nova Micro
- the frontend stores the API key in browser `localStorage`
- `POST /v1/extract-url` now uses browser-like fetch headers and can optionally fall back to a configured browser-render service when direct fetches are blocked
- there is no local app server in this repo right now

## Architecture

High-level architecture:

```text
Browser frontend
  -> CloudFront
  -> private S3 frontend bucket

Browser / scripts
  -> API Gateway HTTP API
  -> Lambda handler
  -> DynamoDB single table
  -> S3 files/results bucket

Route53 + ACM
  -> frontend custom domain
  -> API custom domain
```

Code layout:

- `frontend/`: static frontend app bundled with `esbuild`
- `frontend/src/main.ts`: thin frontend bootstrap that renders the app shell and wires feature modules
- `frontend/src/config/`: split runtime configuration and UI defaults for API URLs, storage keys, and starter schemas
- `frontend/src/layout/`: page shell and header composition modules that keep top-level markup out of the bootstrap file
- `frontend/src/features/`: tab-specific UI modules for text extraction, URL extraction, usage, docs, and workspace tabs, plus feature-local selectors and shared workspace helpers
- `frontend/src/sections/`: product-site sections such as hero, API examples, use cases, and pricing
- `frontend/src/lib/`: shared frontend helpers for API calls, DOM access, schema parsing, storage, and types
- `frontend/index.html`: HTML entrypoint
- `frontend/styles.css` and `frontend/styles/`: CSS entrypoint plus split tokens, base, layout, marketing, workspace, and responsive styles
- `backend/`: Lambda backend bundled with `esbuild`
- `backend/src/handler.ts`: thin Lambda entrypoint that authenticates, resolves a route, and delegates
- `backend/src/routes/`: one module per API endpoint so request flow stays easy to follow and modify
- `backend/src/config/`: environment-derived backend configuration such as model IDs, limits, origins, and fetch settings
- `backend/src/domain/`: shared backend domain types for auth, extraction, jobs, usage, and JSON payloads
- `backend/src/http/`: HTTP-facing error and response helpers
- `backend/src/parsing/`: pure request, HTML, model-response, and PDF text parsing helpers
- `backend/src/providers/`: external integration adapters for Bedrock, Textract, fetch, browser-render fallback, and PDF parsing
- `backend/src/repositories/`: focused DynamoDB access modules for API keys, jobs, usage, and shared key/client helpers
- `backend/src/services/`: orchestration logic for auth and extraction workflows
- `infra/cloudformation.yaml`: primary production stack
- `infra/legacy-minimal.yaml`: older minimal stack kept for legacy parity only
- `scripts/build/`: frontend and backend bundling entrypoints
- `scripts/dev/`: one-off developer utilities such as API key creation
- `scripts/test/`: live checks and smoke tests against deployed surfaces
- `scripts/lib/`: shared script helpers such as runtime stack output resolution
- `docs/adr/`: architecture decision records for choices that should not be rediscovered from code
- `AGENTS.md`: repo-specific guidance for AI or human contributors making structural changes

## Local Build

Install dependencies:

```bash
npm install
```

Build everything:

```bash
npm run build
```

Build frontend only:

```bash
npm run build:frontend
```

Build backend only:

```bash
npm run build:backend
```

Build outputs:

- `npm run build:frontend` writes `dist/frontend/app.js`, `dist/frontend/index.html`, and `dist/frontend/styles.css`
- `npm run build:frontend` also copies `dist/frontend/styles/` for the imported CSS partials
- `npm run build:backend` writes `dist/backend/index.js` and `dist/backend/index.js.map`

## Deployment Prerequisites

Before deploying, make sure you have:

- Node.js and `npm`
- `aws-cli`
- valid AWS credentials
- an AWS CLI profile with permission to manage CloudFormation, Lambda, API Gateway, S3, CloudFront, Route53, DynamoDB, IAM, and ACM
- a Route53 hosted zone for your chosen domain
- an ACM certificate that covers the frontend and API hostnames
- a deployment S3 bucket for Lambda artifacts

Default deployment behavior:

- deploy script: [deploy.sh](/Users/basilsergius/projects/extractkit/deploy.sh)
- primary template: [infra/cloudformation.yaml](/Users/basilsergius/projects/extractkit/infra/cloudformation.yaml)
- default AWS CLI profile used by the script: `basil`
- default AWS region shown in examples: `us-east-1`
- current default domain assumptions in the repo: `vberkoz.com`, `extractkit.vberkoz.com`, `extractkit-api.vberkoz.com`

Deploy command:

```bash
AWS_REGION=us-east-1 \
npm run deploy
```

Useful environment variables:

- `AWS_PROFILE`
- `STACK_NAME`
- `DEPLOY_BUCKET`
- `AWS_REGION`
- `PROJECT_NAME`
- `DOMAIN_NAME`
- `API_DOMAIN_NAME`
- `HOSTED_ZONE_ID`
- `FRONTEND_CERT_ARN`
- `API_CERT_ARN`

Example override:

```bash
AWS_PROFILE=other-profile \
DOMAIN_NAME=extractkit.vberkoz.com \
API_DOMAIN_NAME=extractkit-api.vberkoz.com \
DEPLOY_BUCKET=extractkit-artifacts-example \
AWS_REGION=us-east-1 \
npm run deploy
```

## Required AWS Resources

The production stack provisions or expects the following AWS resources:

- API Gateway HTTP API for the backend
- Lambda function for the backend handler
- DynamoDB table for API keys, users, jobs, results, and usage
- private S3 bucket for frontend assets
- CloudFront distribution in front of the frontend bucket
- private S3 bucket for uploaded files and extraction results
- Route53 hosted zone records for frontend and API domains
- ACM certificates for the frontend and API custom domains
- deployment artifact bucket used by the deploy script

CloudFormation outputs published by the stack:

- `ExtractKitTableName`
- `FrontendBucketName`
- `FrontendDistributionId`
- `FrontendDistributionDomainName`
- `FrontendUrl`
- `FilesBucketName`
- `BackendFunctionName`
- `HttpApiId`
- `ApiUrl`

The legacy template at `infra/legacy-minimal.yaml` publishes `FrontendWebsiteUrl` and `BackendFunctionUrl` instead of `FrontendUrl` and `ApiUrl`.

## DNS Setup

The repo’s current production setup assumes:

- frontend domain: `extractkit.vberkoz.com`
- API domain: `extractkit-api.vberkoz.com`
- hosted zone: `vberkoz.com`
- wildcard certificate pattern: `*.vberkoz.com`

At a high level, DNS and certificate setup should provide:

1. A Route53 hosted zone for the parent domain.
2. A frontend DNS record pointing the frontend hostname to CloudFront.
3. An API DNS record pointing the API hostname to API Gateway custom domain infrastructure.
4. ACM certificates that cover both hostnames.

The deploy script and CloudFormation stack currently expect these values to exist or be passed in through environment variables. If you change domains, update:

- `DOMAIN_NAME`
- `API_DOMAIN_NAME`
- `HOSTED_ZONE_ID`
- `FRONTEND_CERT_ARN`
- `API_CERT_ARN`

## How To Create API Key

Use the included script:

```bash
AWS_PROFILE=basil \
EXTRACTKIT_TABLE_NAME=extractkit \
AWS_REGION=us-east-1 \
npm run create:api-key
```

What it does:

- creates a new dev user item
- creates a new API key item
- hashes the raw bearer token with SHA-256 before storing it
- prints the raw `ek_live_...` key once to stdout

Relevant files:

- [scripts/dev/create-api-key.ts](/Users/basilsergius/projects/extractkit/scripts/dev/create-api-key.ts)
- [scripts/dev/run-create-api-key.mjs](/Users/basilsergius/projects/extractkit/scripts/dev/run-create-api-key.mjs)

The backend authenticates by hashing the presented bearer token and looking up:

- `PK=APIKEY#{apiKeyHash}`
- `SK=METADATA`

## API Examples

Response envelope for success:

```json
{
  "ok": true,
  "data": {}
}
```

Response envelope for errors:

```json
{
  "ok": false,
  "error": {
    "message": "...",
    "code": "...",
    "fields": {
      "fieldName": ["..."]
    }
  }
}
```

Authentication:

- `GET /v1/health` is public
- every other route expects `Authorization: Bearer <token>`
- missing or disabled API keys return `401 UNAUTHORIZED`

Routes:

- `GET /v1/health`
- `POST /v1/extract`
- `POST /v1/extract-url`
- `POST /v1/extract-pdf`
- `GET /v1/jobs/{jobId}`
- `GET /v1/usage`

Example `POST /v1/extract` request:

```json
{
  "content": "Account summary for Acme Inc. Primary contact is hello@acme.com. Website is https://acme.com. The company launched on March 4, 2025. It is active. Tags include alpha and beta. Recent scores were 10, 20, and 30.",
  "schema": {
    "company": {
      "name": "string",
      "contact": {
        "email": "string"
      },
      "website": "string",
      "launchedOn": "string",
      "active": "boolean",
      "tags": ["string"],
      "scores": ["number"]
    }
  },
  "options": {
    "mode": "sync",
    "debug": true
  }
}
```

Example `POST /v1/extract` response:

```json
{
  "ok": true,
  "data": {
    "jobId": "extract_...",
    "data": {
      "companyName": "Acme Inc",
      "contactEmail": "hello@acme.com",
      "price": 1200.5,
      "active": true,
      "launchedOn": "2025-03-04",
      "tags": ["alpha", "beta"],
      "scores": [10, 20, 30],
      "website": "https://acme.com"
    },
    "confidence": 0.5,
    "usage": {
      "units": 1
    }
  }
}
```

Example `POST /v1/extract-url` request:

```json
{
  "url": "https://example.com",
  "schema": {
    "title": "string",
    "website": "url",
    "description": "string"
  },
  "options": {
    "mode": "sync",
    "debug": true
  }
}
```

Example `POST /v1/extract-url` response:

```json
{
  "ok": true,
  "data": {
    "jobId": "url_...",
    "data": {
      "title": "Example Domain",
      "website": "https://example.com/",
      "description": null
    },
    "confidence": 0.5,
    "usage": {
      "units": 1
    }
  }
}
```

Example `POST /v1/extract-pdf` request:

```json
{
  "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  "schema": {
    "document": {
      "title": "string",
      "firstLine": "string"
    }
  }
}
```

Example `POST /v1/extract-pdf` response:

```json
{
  "ok": true,
  "data": {
    "jobId": "pdf_...",
    "data": {
      "document": {
        "title": "Dummy PDF",
        "firstLine": "Dummy PDF file"
      }
    },
    "confidence": 0.82,
    "usage": {
      "units": 1
    }
  }
}
```

Example `GET /v1/jobs/{jobId}` response:

```json
{
  "ok": true,
  "data": {
    "jobId": "pdf_...",
    "status": "completed",
    "createdAt": "2026-06-18T10:09:59.947Z",
    "result": {
      "jobId": "extract_...",
      "data": {
        "invoiceNumber": "INV-123"
      },
      "confidence": 0.5,
      "usage": {
        "units": 1
      }
    }
  }
}
```

## DynamoDB Single-Table Design

The backend uses one DynamoDB table exposed to Lambda as `EXTRACTKIT_TABLE_NAME`.

Primary key:

- `PK` as the partition key
- `SK` as the sort key

Current item patterns:

- API key: `PK=APIKEY#{apiKeyHash}`, `SK=METADATA`
- user: `PK=USER#{userId}`, `SK=METADATA`
- usage by month: `PK=USER#{userId}`, `SK=USAGE#{yyyy-MM}`
- job metadata: `PK=JOB#{jobId}`, `SK=METADATA`
- user job listing: `PK=USER#{userId}`, `SK=JOB#{createdAt}#{jobId}`
- extraction result: `PK=JOB#{jobId}`, `SK=RESULT`

What this table currently stores:

- user identity and plan metadata
- API key ownership and status
- monthly usage counters
- job metadata and status
- final extraction payloads

## Current Behavior Notes

`POST /v1/extract` currently:

- sends the request to Amazon Nova Micro through Bedrock
- accepts any non-empty JSON object as the extraction schema, including nested objects and arrays
- returns the model's JSON output directly instead of coercing against a fixed flat type list
- stores the job and result in DynamoDB
- increments monthly usage by 1 unit

`POST /v1/extract-url` currently:

- fetches the target URL with a 10 second timeout
- rejects responses larger than 1,000,000 bytes
- uses browser-like `User-Agent`, `Accept`, `Accept-Language`, and navigation-style request headers
- strips noisy HTML like `script`, `style`, `nav`, `footer`, and `svg`
- converts remaining HTML into rough readable text
- sends the readable page content plus page hints to Amazon Nova Micro
- can retry through a configured browser-render endpoint when direct fetches are blocked with statuses like `403` or `429`

`POST /v1/extract-pdf` currently:

- validates `pdfUrl`
- validates the schema
- downloads the PDF directly
- attempts native per-page PDF text extraction first
- selectively renders and OCRs weak/scanned pages with Textract for hybrid PDFs
- falls back to full-document Textract OCR when the PDF appears fully scanned or native extraction fails
- sends the extracted text to Amazon Nova Micro for schema-based extraction
- stores the completed job and result synchronously
- currently relies on Textract's synchronous PDF path, so large PDFs over the synchronous limit will fail

## Verify Deployment

Redeploy:

```bash
./deploy.sh
```

List stack outputs:

```bash
aws --profile basil cloudformation describe-stacks \
  --stack-name extractkit \
  --region us-east-1 \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table
```

Confirm stack resources:

```bash
aws --profile basil cloudformation describe-stack-resources \
  --stack-name extractkit \
  --region us-east-1 \
  --query "StackResources[].[LogicalResourceId,ResourceType,PhysicalResourceId]" \
  --output table
```

Run smoke tests:

```bash
npm run test:live-extract
npm run test:frontend-live
npm run test:custom-domains
npm run test:get-job
npm run test:extract-pdf
npm run test:usage
npm run test:live-smoke
```

## Next Implementation Priorities

Based on the current repo state, the next high-value priorities are:

1. Improve extraction confidence scoring and add richer debug traces for Nova Micro responses and schema-shape adherence.
2. Add chunking, large-file handling, and richer OCR/layout handling for complex PDFs.
3. Add local development ergonomics such as a local app server, local API run mode, and a lightweight automated test loop.
4. Tighten auth and tenant controls around API keys, plan enforcement, rate limits, and disabled-key handling.
5. Expand observability with structured logs, failure visibility, and clearer job lifecycle metrics.
6. Add more complete API docs and frontend affordances for job polling, PDF workflows, and error inspection.
