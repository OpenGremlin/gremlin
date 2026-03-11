const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all monorepo packages
config.watchFolders = [monorepoRoot];

// Resolve node_modules from both the project and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// SVGs as asset files
config.resolver.assetExts = [...(config.resolver.assetExts || []), "svg"];

module.exports = withNativeWind(config, { input: "./global.css" });
