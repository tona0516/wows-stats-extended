const nexe = require('nexe')

const baseSetting = {
  input: './dist/app.js',
  resources: [
    './resource/**/*',
  ]
}

const build = (setting) => {
  nexe.compile(setting).catch(err => {
    console.log(`Failed to build: ${err}`)
  })
}

const main = () => {
  const packageJson = require('./package.json')

  const targets = [
    'mac-x64-12.9.1',
    'windows-x64-12.9.1',
  ];

  targets.forEach((it) => {
    build(
      Object.assign(baseSetting, {
        target: it,
        output: `wows-stats-extended-${it}-${packageJson.version}`
      })
    )
  });
}

main()
