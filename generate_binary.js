const { exec } = require('pkg')
const packageJsonPath = "./package.json";
const packageJson = require(packageJsonPath);

(async () => {
    await exec(["dist/app.js", "--config", packageJsonPath, "--output", `${packageJson.name}-${packageJson.version}`, "--compress", "Brotli"])
})()
