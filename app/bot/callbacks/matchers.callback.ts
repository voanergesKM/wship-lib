import { viewAssetCallback } from "./view-asset.callback";

export const callbackMatchers = [
  {
    pattern: /^view_(.+)$/,

    handler: viewAssetCallback,
  },
];
