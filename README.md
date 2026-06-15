# ExtractKit

Minimal TypeScript monorepo with:

- `frontend/`: plain HTML, CSS, and TypeScript bundled with `esbuild`
- `backend/`: AWS Lambda TypeScript bundled with `esbuild`
- `infra/`: CloudFormation YAML
- `scripts/`: local build and deployment scripts
- `dist/`: generated output

## Getting started

```bash
npm install
npm run build
```

## Deploy

The deploy flow uses `aws-cli` and expects valid AWS credentials.

```bash
AWS_REGION=us-east-1 npm run deploy
```

Optional environment variables:

- `STACK_NAME`
- `PROJECT_NAME`
- `ARTIFACT_BUCKET`
- `AWS_REGION`
