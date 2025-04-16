const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// dist/main 디렉토리가 없으면 생성
if (!fs.existsSync("dist/main")) {
  fs.mkdirSync("dist/main", { recursive: true });
}

// 필요한 파일들을 복사
const filesToCopy = [
  "src/main/preload.js",
  "src/main/config.json",
  "src/main/tray.js",
  "src/main/serviceAccountKey.json",
];

filesToCopy.forEach((file) => {
  const sourcePath = file;
  const destPath = path.join("dist/main", path.basename(file));
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${file} to ${destPath}`);
});

// main.js 빌드
esbuild
  .build({
    entryPoints: ["src/main/main.js"],
    bundle: true,
    outfile: "dist/main/main.js",
    platform: "node",
    target: "node18",
    external: [
      "electron",
      "electron-store",
      "firebase-admin",
      "node-machine-id",
    ],
    format: "cjs",
    alias: {
      "@": path.resolve(__dirname, "src/main"),
    },
  })
  .catch(() => process.exit(1));
