# StreamBand Infrastructure

## Purpose

`infra/` is the isolated AWS CDK + TypeScript package for StreamBand infrastructure source. CLOUD-003B established the local toolchain and empty nonprod stack skeleton. CLOUD-OIDC-001-PREP adds a reviewable deployment-trust stack without deploying it.

Local build, test, and synth do not connect to AWS or require credentials. The repository now defines OIDC/IAM candidates, but no resource from the deployment-trust stack has been deployed.

## Current status

- Environment boundary: `nonprod` only
- Region policy: `ap-northeast-1` is the planning baseline; implementation-time availability, quota, and pricing must be rechecked
- `StreamBandNonprodFoundation`: zero application resources
- `StreamBandNonprodDeploymentTrust`: proposed GitHub OIDC provider, deployment role, and narrowly scoped bootstrap-role delegation; repository definition only
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

`npm run synth` uses `--no-lookups` and must succeed without AWS credentials. The foundation template remains empty. The deployment-trust template must contain only the reviewed OIDC/IAM resources and parameterized immutable GitHub identity values.

## Safety boundary

CLOUD-003C bootstrap was completed by a human under a separate gate. That approval does not authorize deployment of `StreamBandNonprodDeploymentTrust` or any application stack. Do not run deploy, diff, destroy, import, watch, or another bootstrap without a new explicit Human Gate.

The current OIDC stack intentionally grants the GitHub entry role only `sts:AssumeRole` for the existing CDK deploy, file-publishing, and lookup roles. It does not include `AdministratorAccess`, direct CloudFormation execution-role access, image-publishing access, or direct SSM access. The `nonprod` GitHub Environment and deployment workflow are not created by this package.

Do not store account identifiers, email addresses, credentials, private hostnames, or unreleased project metadata in this directory.

## Next step

Review the exact synthesized trust template, create and protect the GitHub `nonprod` Environment, and obtain separate approval before the one-time deployment-trust stack activation. OIDC credential verification and application deployment remain later, separate tasks.
