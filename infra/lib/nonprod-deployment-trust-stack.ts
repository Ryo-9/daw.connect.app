import {
  CfnParameter,
  Duration,
  Fn,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

const GITHUB_OIDC_HOST = "token.actions.githubusercontent.com";
const GITHUB_OIDC_URL = `https://${GITHUB_OIDC_HOST}`;
const GITHUB_STS_AUDIENCE = "sts.amazonaws.com";

export class NonprodDeploymentTrustStack extends Stack {
  public static readonly environmentName = "nonprod";
  public static readonly branchRef = "refs/heads/main";
  public static readonly defaultBootstrapQualifier = "hnb659fds";
  public static readonly deploymentRoleName =
    "streamband-nonprod-github-deploy";

  public constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, {
      ...props,
      description:
        props.description ??
        "StreamBand nonprod GitHub OIDC deployment trust (not deployed)",
    });

    const githubOwnerId = new CfnParameter(this, "GitHubOwnerId", {
      type: "String",
      noEcho: true,
      allowedPattern: "^[0-9]+$",
      description:
        "Immutable GitHub owner ID supplied only at the approved deployment gate",
    });
    const githubRepositoryId = new CfnParameter(this, "GitHubRepositoryId", {
      type: "String",
      noEcho: true,
      allowedPattern: "^[0-9]+$",
      description:
        "Immutable GitHub repository ID supplied only at the approved deployment gate",
    });

    const immutableSubject = Fn.sub(
      "repo:Ryo-9@${OwnerId}/daw.connect.app@${RepositoryId}:environment:nonprod",
      {
        OwnerId: githubOwnerId.valueAsString,
        RepositoryId: githubRepositoryId.valueAsString,
      },
    );

    const provider = new iam.OidcProviderNative(
      this,
      "GitHubActionsOidcProvider",
      {
        url: GITHUB_OIDC_URL,
        clientIds: [GITHUB_STS_AUDIENCE],
      },
    );

    const deploymentRole = new iam.Role(this, "GitHubDeploymentRole", {
      roleName: NonprodDeploymentTrustStack.deploymentRoleName,
      description:
        "Short-lived GitHub Actions entry role for reviewed StreamBand nonprod CDK deployments",
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.OpenIdConnectPrincipal(provider, {
        StringEquals: {
          [`${GITHUB_OIDC_HOST}:aud`]: GITHUB_STS_AUDIENCE,
          [`${GITHUB_OIDC_HOST}:sub`]: immutableSubject,
          [`${GITHUB_OIDC_HOST}:environment`]:
            NonprodDeploymentTrustStack.environmentName,
          [`${GITHUB_OIDC_HOST}:ref`]:
            NonprodDeploymentTrustStack.branchRef,
        },
      }),
    });

    const bootstrapRoleArns = ["deploy", "file-publishing", "lookup"].map(
      (rolePurpose) =>
        Fn.sub(
          `arn:\${AWS::Partition}:iam::\${AWS::AccountId}:role/cdk-${NonprodDeploymentTrustStack.defaultBootstrapQualifier}-${rolePurpose}-role-\${AWS::AccountId}-\${AWS::Region}`,
        ),
    );

    deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AssumeReviewedCdkBootstrapRoles",
        effect: iam.Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: bootstrapRoleArns,
        conditions: {
          StringEquals: {
            "iam:ResourceTag/aws-cdk:bootstrap-role": [
              "deploy",
              "file-publishing",
              "lookup",
            ],
          },
        },
      }),
    );
  }
}
