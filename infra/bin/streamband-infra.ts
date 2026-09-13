#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { NonprodDeploymentTrustStack } from "../lib/nonprod-deployment-trust-stack";
import { NonprodFoundationStack } from "../lib/nonprod-foundation-stack";

const app = new cdk.App({
  analyticsReporting: false,
});

new NonprodFoundationStack(app, "StreamBandNonprodFoundation");
new NonprodDeploymentTrustStack(app, "StreamBandNonprodDeploymentTrust", {
  env: {
    region: NonprodFoundationStack.regionPolicy,
  },
});

app.synth();
