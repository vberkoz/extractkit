# ExtractKit

Minimal TypeScript monorepo with:

- `frontend/`: plain HTML, CSS, and TypeScript bundled with `esbuild`
- `backend/`: AWS Lambda TypeScript bundled with `esbuild`
- `infra/`: CloudFormation YAML
- `scripts/`: local build and deployment scripts
- `dist/`: generated output

## Quick context

This repo is intentionally small and mostly centered around one backend Lambda handler.

- the frontend is a static smoke-test page that only confirms the bundle loaded
- the backend is a single Lambda entrypoint at `backend/src/handler.ts`
- the backend persists API keys, jobs, results, and usage in one DynamoDB table
- there is no local app server or test runner in the repo right now
- builds are done with `esbuild`, and deployment is driven by `deploy.sh`

## Repo map

- `backend/src/handler.ts`: HTTP routing, auth, request parsing, mock extraction, schema validation, and API responses
- `backend/src/dynamodb.ts`: DynamoDB access helpers for API keys, jobs, results, and usage
- `frontend/src/index.ts`: minimal frontend entrypoint that writes a timestamp into the page
- `frontend/index.html` and `frontend/styles.css`: static site assets copied to `dist/frontend`
- `infra/cloudformation.yaml`: production CloudFormation for CloudFront, custom domains, Route53, HTTP API, Lambda, DynamoDB, and S3 buckets
- `infra/template.yaml`: older minimal CloudFormation for the DynamoDB table, S3 website bucket, Lambda, and Function URL
- `scripts/build-frontend.mjs`: bundles frontend TypeScript to `dist/frontend/app.js`
- `scripts/build-backend.mjs`: bundles Lambda code to `dist/backend/index.js`
- `deploy.sh`: installs dependencies if needed, builds both packages, uploads the Lambda zip to S3, deploys CloudFormation, syncs frontend assets to S3, and invalidates CloudFront
- `scripts/deploy.sh`: compatibility wrapper that forwards to the root deploy script
- `scripts/lib/runtime-config.mjs`: resolves the API base URL from env vars or stack outputs for live scripts
- `scripts/create-api-key.ts`: seeds a dev user and API key into DynamoDB and prints the raw key once
- `scripts/test-live-extract.mjs`: sends a live `POST /v1/extract` request and validates the extracted response payload
- `scripts/test-custom-domains.mjs`: verifies the frontend custom domain, API health route, and authenticated extract request against the deployed custom domains
- `scripts/test-extract-pdf.mjs`: sends a live `POST /v1/extract-pdf` request to the deployed API using bearer auth
- `scripts/test-get-job.mjs`: sends a live `POST /v1/extract-pdf` request, then fetches the created job with `GET /v1/jobs/{jobId}`
- `scripts/test-live-smoke.mjs`: runs `health`, `usage`, queued PDF creation, and job retrieval in one live smoke pass
- `scripts/test-usage.mjs`: sends a live `GET /v1/usage` request to the deployed API using bearer auth

## Current state

- `POST /v1/extract` is the most complete route in the repo
- extraction is still mock logic based on `key: value` text parsing, plus light fallback detection for emails, numbers, booleans, URLs, and dates
- `POST /v1/extract-url` fetches HTML, strips noisy tags, converts the page to rough readable text, and runs the same extraction engine as `POST /v1/extract`
- `POST /v1/extract-pdf` is an async placeholder that validates `pdfUrl` and `schema`, stores a queued job, and returns a `jobId`
- `GET /v1/usage` returns the authenticated user's current-month usage from DynamoDB
- `GET /v1/jobs/{jobId}` reads the stored job metadata, including job status, and any saved extraction result

## Build outputs

- `npm run build:frontend` writes `dist/frontend/app.js`, `dist/frontend/index.html`, and `dist/frontend/styles.css`
- `npm run build:backend` writes `dist/backend/index.js` and `dist/backend/index.js.map`
- `npm run build` runs both builds
- `npm run test:live-extract` runs a live extract endpoint smoke test
- `npm run test:custom-domains` verifies the frontend and API custom domains end to end
- `npm run test:extract-pdf` runs the live queued PDF job smoke test
- `npm run test:get-job` runs a live end-to-end create-job then get-job smoke test
- `npm run test:usage` runs a live usage endpoint smoke test

The deployed stack includes:

- a private frontend S3 bucket behind CloudFront
- a custom frontend domain in Route53
- an HTTP API Gateway backend with a custom API domain
- a DynamoDB table used for API keys, jobs, results, and usage
- a private S3 bucket for uploaded files and results

## Data model

The backend uses a single DynamoDB table named from the CloudFormation `ProjectName`
parameter and exposed to Lambda as `EXTRACTKIT_TABLE_NAME`.

Primary key:

- `PK` string partition key
- `SK` string sort key

Item patterns:

- API key: `PK=APIKEY#{apiKeyHash}`, `SK=METADATA`
- User: `PK=USER#{userId}`, `SK=METADATA`
- Usage by month: `PK=USER#{userId}`, `SK=USAGE#{yyyy-MM}`
- Job: `PK=JOB#{jobId}`, `SK=METADATA`
- User jobs: `PK=USER#{userId}`, `SK=JOB#{createdAt}#{jobId}`
- Extraction result: `PK=JOB#{jobId}`, `SK=RESULT`

## Getting started

```bash
npm install
npm run build
```

## Deploy

The deploy flow uses `aws-cli` only and expects valid AWS credentials.
By default, [`deploy.sh`](/Users/basilsergius/projects/extractkit/deploy.sh) uses the AWS CLI profile `basil`.
By default it deploys [`infra/cloudformation.yaml`](/Users/basilsergius/projects/extractkit/infra/cloudformation.yaml).
The root script builds the backend and frontend separately with `esbuild`, uploads the Lambda zip to the deployment S3 bucket, deploys CloudFormation, syncs frontend assets to the frontend bucket, and invalidates the CloudFront distribution.
It now hardcodes the `vberkoz.com` hosted zone, uses a wildcard `*.vberkoz.com` ACM certificate by default for both frontend and API, and defaults the API domain to `extractkit-api.vberkoz.com` so the wildcard certificate covers both hostnames.

```bash
AWS_REGION=us-east-1 \
npm run deploy
```

Optional environment variables:

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

## Stack outputs

The CloudFormation stack publishes:

- `ExtractKitTableName`: DynamoDB table name used by the backend
- `FrontendBucketName`: S3 bucket receiving synced frontend assets
- `FrontendDistributionId`: CloudFront distribution ID for the frontend
- `FrontendDistributionDomainName`: CloudFront hostname for the frontend
- `FrontendUrl`: custom frontend URL
- `FilesBucketName`: S3 bucket for uploaded files and results
- `BackendFunctionName`: deployed Lambda function name
- `HttpApiId`: API Gateway HTTP API ID
- `ApiUrl`: custom domain URL for the backend API

The legacy template publishes `FrontendWebsiteUrl` and `BackendFunctionUrl` instead of `FrontendUrl` and `ApiUrl`.

## Verify deploy

Redeploy the stack:

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

Confirm the DynamoDB table resource exists in the stack:

```bash
aws --profile basil cloudformation describe-stack-resources \
  --stack-name extractkit \
  --region us-east-1 \
  --query "StackResources[].[LogicalResourceId,ResourceType,PhysicalResourceId]" \
  --output table
```

Confirm Lambda received the table name env var:

```bash
FUNCTION_NAME="$(aws --profile basil cloudformation describe-stack-resources \
  --stack-name extractkit \
  --region us-east-1 \
  --query "StackResources[?LogicalResourceId=='ExtractKitFunction'].PhysicalResourceId" \
  --output text)"

aws --profile basil lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region us-east-1 \
  --query "Environment.Variables"
```

Confirm the DynamoDB table exists:

```bash
aws --profile basil dynamodb describe-table \
  --table-name extractkit \
  --region us-east-1 \
  --query "Table.[TableName,TableStatus,BillingModeSummary.BillingMode]"
```

Run the live extract smoke test:

```bash
npm run test:live-extract
```

Run the custom-domain smoke test:

```bash
npm run test:custom-domains
```

Run the live job retrieval smoke test:

```bash
npm run test:get-job
```

Run the all-in-one live smoke test:

```bash
npm run test:live-smoke
```

Run the live usage smoke test:

```bash
npm run test:usage
```

## API

Response envelope for successful requests:

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

The `error.fields` object is returned only when `options.debug` is `true` and validation has field-level details to report.

Authentication:

- `GET /v1/health` is public
- every other route expects `Authorization: Bearer <token>`
- the backend hashes the bearer token with SHA-256 and looks up `PK=APIKEY#{hash}`, `SK=METADATA`
- missing or disabled API keys return `401 UNAUTHORIZED`

Routes:

- `GET /v1/health`: basic service health
- `POST /v1/extract`: mock text extraction route backed by DynamoDB job storage
- `POST /v1/extract-url`: fetches a URL, cleans the HTML into readable text, and stores the extraction job and result
- `POST /v1/extract-pdf`: validates `pdfUrl` and `schema`, then creates a queued PDF extraction job
- `GET /v1/jobs/{jobId}`: returns the stored job metadata and extraction result for the authenticated user only
- `GET /v1/usage`: returns the current month usage summary for the authenticated user

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

The `status` value is one of `completed`, `queued`, or `failed`. Non-owner users receive `404`.

Example `POST /v1/extract` request:

```json
{
  "content": "companyName: Acme Inc\ncontactEmail: hello@acme.com\nprice: $1,200.50\nactive: yes\nlaunchedOn: March 4, 2025\ntags: alpha, beta\nscores: 10, 20, 30\nwebsite: https://acme.com",
  "schema": {
    "companyName": "string",
    "contactEmail": "email",
    "price": "number",
    "active": "boolean",
    "launchedOn": "date",
    "tags": "array:string",
    "scores": "array:number",
    "website": "url"
  },
  "options": {
    "mode": "sync",
    "debug": true
  }
}
```

Example response:

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

Example response:

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
  "pdfUrl": "https://example.com/file.pdf",
  "schema": {
    "invoiceNumber": "string",
    "totalAmount": "number",
    "vendorEmail": "email"
  }
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "jobId": "pdf_...",
    "status": "queued"
  }
}
```

Current mock extraction behavior:

- reads keys from the provided `schema`
- returns `null` for missing values
- detects emails with regex
- detects numbers, prices, URLs, booleans, and date-like strings
- extracts obvious `key: value` pairs and then coerces them to schema types
- validates the request body, schema object, and extracted result types without external libraries
- supports schema field types: `string`, `number`, `boolean`, `date`, `email`, `url`, `array:string`, `array:number`
- coerces values like `$1,200.50` to `1200.5`, `yes`/`no` to booleans, and common date strings to ISO `YYYY-MM-DD`
- keeps missing fields as `null`, but returns field-level validation errors when present values fail coercion or type checks and `options.debug` is enabled
- stores the job and result in DynamoDB
- increments monthly usage by 1 unit

Additional `POST /v1/extract-url` behavior:

- uses built-in `fetch` with a 10 second timeout
- rejects fetched responses larger than 1,000,000 bytes
- strips `script`, `style`, `nav`, `footer`, and `svg` before text cleanup
- converts the remaining HTML to rough readable text with simple regex/manual cleanup
- adds lightweight HTML-aware fallbacks for URL extraction only
- uses `<title>` for fields like `title` or `headline`
- uses the source request URL for `url` fields like `website`, `url`, or `link`
- uses `<meta name="description">` for fields like `description`, `summary`, or `excerpt`

Current `POST /v1/extract-pdf` behavior:

- validates `pdfUrl` as an absolute `http` or `https` URL
- validates the provided `schema` using the same supported schema types as `POST /v1/extract`
- creates a DynamoDB job with status `queued`
- does not parse the PDF yet
- returns the queued job ID immediately

## Test the deployment

Current production custom domains:

```bash
FRONTEND_URL="https://extractkit.vberkoz.com"
API_URL="https://extractkit-api.vberkoz.com"
```

Get the frontend URL from CloudFormation:

```bash
aws --profile=basil cloudformation describe-stacks \
  --stack-name extractkit \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue | [0]" \
  --output text
```

Open that URL in a browser. The page should load and the status card should show that the frontend bundle loaded.

Get the backend URL from CloudFormation:

```bash
aws --profile=basil cloudformation describe-stacks \
  --stack-name extractkit \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue | [0]" \
  --output text
```

Set the backend URL:

```bash
BASE_URL="$(aws --profile=basil cloudformation describe-stacks \
  --stack-name extractkit \
  --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue | [0]" \
  --output text)"
```

If you are still on the legacy template, query `FrontendWebsiteUrl` and `BackendFunctionUrl` instead.

Create a dev API key:

```bash
AWS_PROFILE=basil EXTRACTKIT_TABLE_NAME=extractkit AWS_REGION=us-east-1 npm run create:api-key
```

The script creates:

- a dev user item
- an API key item
- a raw `ek_live_...` key printed once to stdout

Set the raw key from the script output:

```bash
KEY='ek_live_replace_me'
```

Health check stays public:

```bash
curl -i "$BASE_URL/v1/health"
```

Expected response shape:

```json
{"ok":true,"data":{"service":"extractkit","status":"ok","timestamp":"..."}}
```

Protected route without auth should fail:

```bash
curl -i "$BASE_URL/v1/usage"
```

Expected status: `401 Unauthorized`

Protected route with a bad key should fail:

```bash
curl -i "$BASE_URL/v1/usage" \
  -H "Authorization: Bearer ek_live_not_real"
```

Expected status: `401 Unauthorized`

Protected route with a valid key should succeed:

```bash
curl -i "$BASE_URL/v1/usage" \
  -H "Authorization: Bearer $KEY"
```

Expected response shape:

```json
{"ok":true,"data":{"month":"2026-06","used":0,"limit":10000,"plan":"dev"}}
```

Protected POST route with a valid key should succeed:

```bash
curl -i "$BASE_URL/v1/extract-url" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","schema":{"title":"string","website":"url"},"options":{"mode":"sync","debug":true}}'
```

Expected response shape:

```json
{"ok":true,"data":{"jobId":"url_...","data":{"title":"Example Domain","website":"https://example.com/"},"confidence":0.5,"usage":{"units":1}}}
```

Run the live PDF placeholder test script:

```bash
npm run test:extract-pdf
```

Run the live extract test script:

```bash
npm run test:live-extract
```

Run the custom-domain smoke test script:

```bash
npm run test:custom-domains
```

Run the all-in-one live smoke test:

```bash
npm run test:live-smoke
```

Run the live usage test script:

```bash
npm run test:usage
```

Live scripts resolve the API base URL in this order:

- `EXTRACTKIT_BASE_URL`
- CloudFormation output `ApiUrl`
- CloudFormation output `BackendFunctionUrl`
- the hardcoded Lambda URL fallback

You can override the defaults with:

- `EXTRACTKIT_BASE_URL`
- `EXTRACTKIT_FRONTEND_URL`
- `EXTRACTKIT_API_URL`
- `EXTRACTKIT_API_KEY`
- `STACK_NAME`
- `AWS_PROFILE`
- `AWS_REGION`

If the deployed endpoint still returns the older placeholder usage payload, redeploy the backend before relying on the usage smoke test.

Authenticated route examples:

```bash
AUTH_HEADER="Authorization: Bearer $KEY"
```

For JSON requests, keep newline characters inside `content` escaped as `\n`. Literal line breaks inside the JSON string will fail with `INVALID_JSON`.

Happy-path extract check:

```bash
curl -i -X POST "$BASE_URL/v1/extract" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"content":"companyName: Acme Inc\ncontactEmail: hello@acme.com\nprice: $1,200.50\nactive: yes\nlaunchedOn: March 4, 2025\ntags: alpha, beta\nscores: 10, 20, 30\nwebsite: https://acme.com","schema":{"companyName":"string","contactEmail":"email","price":"number","active":"boolean","launchedOn":"date","tags":"array:string","scores":"array:number","website":"url"},"options":{"mode":"sync","debug":true}}'
```

Expected status: `200 OK`

Expected response details:

- `price` is coerced to `1200.5`
- `active` is coerced to `true`
- `launchedOn` is coerced to ISO date `2025-03-04`
- `tags` is returned as `["alpha","beta"]`
- `scores` is returned as `[10,20,30]`

```bash
curl -i -X POST "$BASE_URL/v1/extract-url" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"url":"https://example.com","schema":{"title":"string","website":"url","description":"string"},"options":{"mode":"sync","debug":true}}'
```

```bash
curl -i -X POST "$BASE_URL/v1/extract-pdf" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"pdfUrl":"https://example.com/file.pdf","schema":{"invoiceNumber":"string","totalAmount":"number","vendorEmail":"email"}}'
```

```bash
curl -i "$BASE_URL/v1/jobs/test-job-123" \
  -H "$AUTH_HEADER"
```

After a successful extract request, use the returned job ID here:

```bash
curl -i "$BASE_URL/v1/jobs/extract_replace_me" \
  -H "$AUTH_HEADER"
```

For a queued PDF job, the response should include `status: "queued"` and `result: null` until processing is implemented.

```bash
curl -i "$BASE_URL/v1/usage" \
  -H "$AUTH_HEADER"
```

Error-path checks we verified:

Present but invalid values should return `422 Unprocessable Entity` with field-level errors in debug mode:

```bash
curl -i -X POST "$BASE_URL/v1/extract" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"content":"email: not-an-email\nwebsite: ftp://bad.example\nactive: maybe\nscores: 1, two, 3","schema":{"email":"email","website":"url","active":"boolean","scores":"array:number"},"options":{"mode":"sync","debug":true}}'
```

Expected response details:

- status is `422 Unprocessable Entity`
- `error.code` is `EXTRACTION_VALIDATION_FAILED`
- `error.fields` includes `email`, `website`, `active`, and `scores`

Missing values should remain `null` and should not fail validation:

```bash
curl -i -X POST "$BASE_URL/v1/extract" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"content":"companyName: Acme Inc","schema":{"companyName":"string","website":"url","active":"boolean"},"options":{"mode":"sync","debug":true}}'
```

Expected response details:

- status is `200 OK`
- `website` is `null`
- `active` is `null`

```bash
curl -i -X POST "$BASE_URL/v1/extract-url" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{}'
```

```bash
curl -i -X POST "$BASE_URL/v1/extract-pdf" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{}'
```

```bash
curl -i -X POST "$BASE_URL/v1/extract" \
  -H "content-type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{'
```

```bash
curl -i "$BASE_URL/v1/unknown"
```

Security note:

- rotate any API key after pasting it into a terminal transcript, shell history, or chat

## Test DynamoDB table from the terminal

Seed an API key item:

```bash
aws --profile basil dynamodb put-item \
  --table-name extractkit \
  --region us-east-1 \
  --item '{
    "PK":{"S":"APIKEY#hash_123"},
    "SK":{"S":"METADATA"},
    "apiKeyHash":{"S":"hash_123"},
    "userId":{"S":"user_123"},
    "status":{"S":"active"}
  }'
```

Read back the seeded API key:

```bash
aws --profile basil dynamodb get-item \
  --table-name extractkit \
  --region us-east-1 \
  --key '{
    "PK":{"S":"APIKEY#hash_123"},
    "SK":{"S":"METADATA"}
  }'
```

Create a job metadata item:

```bash
aws --profile basil dynamodb put-item \
  --table-name extractkit \
  --region us-east-1 \
  --item '{
    "PK":{"S":"JOB#job_123"},
    "SK":{"S":"METADATA"},
    "entityType":{"S":"JOB"},
    "jobId":{"S":"job_123"},
    "userId":{"S":"user_123"},
    "createdAt":{"S":"2026-06-18T12:00:00.000Z"},
    "status":{"S":"queued"}
  }'
```

Create the matching user-job item:

```bash
aws --profile basil dynamodb put-item \
  --table-name extractkit \
  --region us-east-1 \
  --item '{
    "PK":{"S":"USER#user_123"},
    "SK":{"S":"JOB#2026-06-18T12:00:00.000Z#job_123"},
    "entityType":{"S":"USER_JOB"},
    "jobId":{"S":"job_123"},
    "userId":{"S":"user_123"},
    "createdAt":{"S":"2026-06-18T12:00:00.000Z"},
    "status":{"S":"queued"}
  }'
```

Save a job result item:

```bash
aws --profile basil dynamodb put-item \
  --table-name extractkit \
  --region us-east-1 \
  --item '{
    "PK":{"S":"JOB#job_123"},
    "SK":{"S":"RESULT"},
    "entityType":{"S":"JOB_RESULT"},
    "jobId":{"S":"job_123"},
    "updatedAt":{"S":"2026-06-18T12:05:00.000Z"},
    "result":{"M":{"text":{"S":"done"},"pages":{"N":"1"}}}
  }'
```

Create or update monthly usage:

```bash
aws --profile basil dynamodb update-item \
  --table-name extractkit \
  --region us-east-1 \
  --key '{
    "PK":{"S":"USER#user_123"},
    "SK":{"S":"USAGE#202606"}
  }' \
  --update-expression "SET #entityType = if_not_exists(#entityType, :entityType), #userId = if_not_exists(#userId, :userId), #yyyyMM = if_not_exists(#yyyyMM, :yyyyMM), #updatedAt = :updatedAt ADD #amount :amount" \
  --expression-attribute-names '{"#entityType":"entityType","#userId":"userId","#yyyyMM":"yyyyMM","#updatedAt":"updatedAt","#amount":"amount"}' \
  --expression-attribute-values '{":entityType":{"S":"USAGE"},":userId":{"S":"user_123"},":yyyyMM":{"S":"202606"},":updatedAt":{"S":"2026-06-18T12:10:00.000Z"},":amount":{"N":"3"}}' \
  --return-values ALL_NEW
```

Query recent jobs for the user:

```bash
aws --profile basil dynamodb query \
  --table-name extractkit \
  --region us-east-1 \
  --key-condition-expression "PK = :pk AND begins_with(SK, :prefix)" \
  --expression-attribute-values '{
    ":pk":{"S":"USER#user_123"},
    ":prefix":{"S":"JOB#"}
  }' \
  --scan-index-forward false
```

Read the job metadata:

```bash
aws --profile basil dynamodb get-item \
  --table-name extractkit \
  --region us-east-1 \
  --key '{
    "PK":{"S":"JOB#job_123"},
    "SK":{"S":"METADATA"}
  }'
```

Read the job result:

```bash
aws --profile basil dynamodb get-item \
  --table-name extractkit \
  --region us-east-1 \
  --key '{
    "PK":{"S":"JOB#job_123"},
    "SK":{"S":"RESULT"}
  }'
```
