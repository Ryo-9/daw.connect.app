import { App, Token } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";

import { NonprodFoundationStack } from "../lib/nonprod-foundation-stack";

function createStack() {
  const app = new App({ analyticsReporting: false });
  const stack = new NonprodFoundationStack(
    app,
    "StreamBandNonprodFoundation",
  );

  return { app, stack };
}

describe("NonprodFoundationStack", () => {
  it("creates the CDK app and nonprod stack offline", () => {
    const { app, stack } = createStack();

    expect(app.node.children).toContain(stack);
    expect(stack.stackName).toBe("StreamBandNonprodFoundation");
    expect(NonprodFoundationStack.environmentName).toBe("nonprod");
    expect(NonprodFoundationStack.regionPolicy).toBe("ap-northeast-1");
  });

  it("contains no AWS resources or private-alpha configuration", () => {
    const { stack } = createStack();
    const template = Template.fromStack(stack).toJSON();

    expect(template.Resources ?? {}).toEqual({});
    expect(JSON.stringify(template).toLowerCase()).not.toContain("private-alpha");
  });

  it("does not bind an account or region during offline synthesis", () => {
    const { stack } = createStack();

    expect(Token.isUnresolved(stack.account)).toBe(true);
    expect(Token.isUnresolved(stack.region)).toBe(true);
  });
});
