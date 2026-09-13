import { App, Token } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { beforeAll, describe, expect, it } from "vitest";

import { NonprodDeploymentTrustStack } from "../lib/nonprod-deployment-trust-stack";

function synthesizeStack() {
  const app = new App({ analyticsReporting: false });
  const stack = new NonprodDeploymentTrustStack(
    app,
    "StreamBandNonprodDeploymentTrust",
    { env: { region: "ap-northeast-1" } },
  );

  return { stack, template: Template.fromStack(stack).toJSON() };
}

function getSingleResource(
  template: Record<string, unknown>,
  resourceType: string,
) {
  const resources = (template.Resources ?? {}) as Record<
    string,
    { Type?: string; Properties?: Record<string, unknown> }
  >;
  const matches = Object.values(resources).filter(
    (resource) => resource.Type === resourceType,
  );

  expect(matches).toHaveLength(1);
  return matches[0].Properties ?? {};
}

function stringify(value: unknown) {
  return JSON.stringify(value);
}

describe("NonprodDeploymentTrustStack", () => {
  let stack: NonprodDeploymentTrustStack;
  let template: Record<string, unknown>;

  beforeAll(() => {
    ({ stack, template } = synthesizeStack());
  }, 30_000);

  it("targets only the named nonprod trust stack without binding an account", () => {
    expect(stack.stackName).toBe("StreamBandNonprodDeploymentTrust");
    expect(stack.region).toBe("ap-northeast-1");
    expect(Token.isUnresolved(stack.account)).toBe(true);
    expect(NonprodDeploymentTrustStack.environmentName).toBe("nonprod");
  });

  it("contains only the reviewed OIDC and IAM resource categories", () => {
    const resources = Object.values(
      (template.Resources ?? {}) as Record<string, { Type?: string }>,
    );

    expect(resources.map((resource) => resource.Type).sort()).toEqual([
      "AWS::IAM::OIDCProvider",
      "AWS::IAM::Policy",
      "AWS::IAM::Role",
    ]);
  });

  it("defines one native GitHub OIDC provider with only the AWS STS audience", () => {
    const provider = getSingleResource(template, "AWS::IAM::OIDCProvider");

    expect(provider.Url).toBe("https://token.actions.githubusercontent.com");
    expect(provider.ClientIdList).toEqual(["sts.amazonaws.com"]);
    expect(provider).not.toHaveProperty("ThumbprintList");
  });

  it("requires the immutable repository, nonprod environment, and main ref exactly", () => {
    const role = getSingleResource(template, "AWS::IAM::Role");
    const trust = stringify(role.AssumeRolePolicyDocument);

    expect(trust).toContain("sts:AssumeRoleWithWebIdentity");
    expect(trust).toContain("token.actions.githubusercontent.com:aud");
    expect(trust).toContain("sts.amazonaws.com");
    expect(trust).toContain("token.actions.githubusercontent.com:sub");
    expect(trust).toContain("repo:Ryo-9@");
    expect(trust).toContain("daw.connect.app@");
    expect(trust).toContain(":environment:nonprod");
    expect(trust).toContain("token.actions.githubusercontent.com:environment");
    expect(trust).toContain("token.actions.githubusercontent.com:ref");
    expect(trust).toContain("refs/heads/main");
    expect(trust).toContain("GitHubOwnerId");
    expect(trust).toContain("GitHubRepositoryId");
    expect(trust).not.toContain("StringLike");
    expect(trust).not.toContain("repo:*/*:*");
    expect(trust).not.toContain("pull_request");
    expect(trust).not.toContain("refs/heads/feature");
  });

  it("keeps immutable GitHub IDs parameterized and the session bounded", () => {
    const parameters = template.Parameters as Record<
      string,
      Record<string, unknown>
    >;
    const role = getSingleResource(template, "AWS::IAM::Role");

    expect(parameters.GitHubOwnerId).toMatchObject({
      Type: "String",
      NoEcho: true,
      AllowedPattern: "^[0-9]+$",
    });
    expect(parameters.GitHubRepositoryId).toMatchObject({
      Type: "String",
      NoEcho: true,
      AllowedPattern: "^[0-9]+$",
    });
    expect(role.RoleName).toBe("streamband-nonprod-github-deploy");
    expect(role.MaxSessionDuration).toBe(3600);
  });

  it("delegates only to the reviewed deploy, file, and lookup bootstrap roles", () => {
    const policy = getSingleResource(template, "AWS::IAM::Policy");
    const policyText = stringify(policy);

    expect(policyText).toContain("sts:AssumeRole");
    expect(policyText).toContain("cdk-hnb659fds-deploy-role-");
    expect(policyText).toContain("cdk-hnb659fds-file-publishing-role-");
    expect(policyText).toContain("cdk-hnb659fds-lookup-role-");
    expect(policyText).toContain("aws-cdk:bootstrap-role");
    expect(policyText).not.toContain("image-publishing-role");
    expect(policyText).not.toContain("cfn-exec-role");
    expect(policyText).not.toContain("AdministratorAccess");
    expect(policyText).not.toContain("iam:*");
    expect(policyText).not.toContain("cloudformation:*");
    expect(policyText).not.toContain("ssm:GetParameter");
  });

  it("contains no account ID or concrete GitHub numeric identity", () => {
    const templateText = stringify(template);

    expect(templateText).not.toMatch(/arn:aws:iam::[0-9]{12}:/);
    expect(templateText).not.toMatch(/Ryo-9@[0-9]+/);
    expect(templateText).not.toMatch(/daw\.connect\.app@[0-9]+/);
  });
});
