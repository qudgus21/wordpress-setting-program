const path = require("path");

module.exports = {
  entryPoints: ["src/main/main.js"],
  bundle: true,
  platform: "node",
  external: ["electron"],
  outdir: "dist/main",
  alias: {
    "@": path.resolve(__dirname, "src/main"),
  },
};
