const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// @livekit/components-react declares dist/index.mjs in its "exports" map
// but v2.9.24 does not ship that file, which breaks web bundling.
// Fall back to the shipped CJS bundle for web only.
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@livekit/components-react" && platform === "web") {
    return {
      filePath: path.join(
        __dirname,
        "node_modules",
        "@livekit",
        "components-react",
        "dist",
        "index.js",
      ),
      type: "sourceFile",
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
