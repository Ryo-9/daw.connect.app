#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { NonprodFoundationStack } from "../lib/nonprod-foundation-stack";

const app = new cdk.App({
  analyticsReporting: false,
});

new NonprodFoundationStack(app, "StreamBandNonprodFoundation");

app.synth();
