# StreamBand Infrastructure

## Purpose

`infra/` is the isolated AWS CDK + TypeScript package for StreamBand infrastructure source. CLOUD-003B establishes only the local repository toolchain and an empty nonprod stack skeleton.

No AWS account is connected, no credential is required, and no AWS resource is defined or deployed.

## Current status

- Environment boundary: `nonprod` only
- Region policy: `ap-northeast-1` is the planning baseline; implementation-time availability, quota, and pricing must be rechecked
- Stack: `StreamBandNonprodFoundation` with zero AWS resources
- Node.js standard: 24.x, matching the repository CI and the AWS CDK supported-version policy
- Generated `node_modules/`, `cdk.out/`, and `coverage/` are not committed

Private Alpha infrastructure and real unreleased-song data are outside this package's current scope.

## Local checks

From this directory:

```bash
npm ci
npm run build
npm run test
npm run synth
npm run check
```

`npm run synth` uses `--no-lookups`. It must remain environment-agnostic and succeed without AWS credentials. The generated template must contain no AWS resources.

## Safety boundary

Until CLOUD-003C receives separate human approval, do not run bootstrap, deploy, diff, destroy, import, or watch commands. Do not configure credentials, connect this package to an AWS account, or add IAM, OIDC, Budget, S3, DynamoDB, Cognito, Lambda, API Gateway, CloudWatch, or other resources.

Do not store account identifiers, email addresses, credentials, private hostnames, or unreleased project metadata in this directory.

## Next step

CLOUD-003C is the future explicit human gate for the first AWS connection and reviewed nonprod bootstrap. It is not authorized by CLOUD-003B.
