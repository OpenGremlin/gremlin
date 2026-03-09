import * as esbuild from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["electron"],
  outdir: "dist/main",
  outExtension: { ".js": ".cjs" },
};

await esbuild.build({
  ...common,
  entryPoints: ["src/main/index.ts", "src/main/preload.ts"],
});

console.log("Main process built successfully.");
