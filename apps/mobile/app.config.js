const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/** Prepend `use_modular_headers!` to the Podfile so Firebase Swift pods compile. */
function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (!contents.includes("use_modular_headers!")) {
        contents = `use_modular_headers!\n${contents}`;
      }
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
}

module.exports = ({ config }) => {
  config.plugins.push(withModularHeaders);
  return config;
};
