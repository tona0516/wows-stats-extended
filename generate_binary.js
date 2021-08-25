const nexe = require("nexe");

const nodeVersion = "14.15.3";
const platforms = ["linux-x64", "mac-x64", "windows-x64"];

const baseOptions = {
  input: "dist/app.js",
  resources: ["resource/**/*"],
};

const compile = async (options) => {
  await nexe.compile(options).catch((error) => {
    console.log(
      `Failed to build: options=${JSON.stringify(options)} error=${error}`
    );
    process.exit(1);
  });
};

const main = () => {
  const packageJson = require("./package.json");
  const appName = packageJson.name;
  const appVersion = packageJson.version;

  const targets = platforms.map((it) => `${it}-${nodeVersion}`);

  targets.forEach(async (it) => {
    const options = {
      ...baseOptions,
      target: it,
      output: `${appName}-${appVersion}-${it}`,
    };
    await compile(options);
  });
};

main();
