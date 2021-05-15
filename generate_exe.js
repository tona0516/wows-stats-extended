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

  build(
    Object.assign(baseSetting, {
      target: 'mac-x64-16.7.0',
      output: `wows-stats-extended-for-mac-${packageJson.version}`
    })
  )
  build(
    Object.assign(baseSetting, {
      target: 'windows-x64-16.7.0',
      output: `wows-stats-extended-for-windows-${packageJson.version}`
    })
  )
}

main()
