import { Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";

export class NonprodFoundationStack extends Stack {
  public static readonly environmentName = "nonprod";
  public static readonly regionPolicy = "ap-northeast-1";

  public constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, {
      ...props,
      description:
        props.description ??
        "StreamBand nonprod CDK repository foundation (no AWS resources)",
    });
  }
}
