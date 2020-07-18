const { compile } = require('nexe')

const packageJson = require('../package.json')

const baseSetting = {
  input: './bin/www',
  output: `wows-stats-extended-${packageJson.version}`,
  resouces: [
    'public/',
    'views/'
  ]
}

const build = (setting, platform) => {
  compile(setting).then(() => {
    console.log(`Build ${platform} binary successfully.`)
  }).catch(err => {
    console.log(`Failed to build ${platform} binary: ${err}`)
  })
}

const main = () => {
  build(
    Object.assign(
      baseSetting,
      { target: 'mac-x64-12.18.2' }
    ),
    'Mac'
  )
  build(
    Object.assign(
      baseSetting,
      { target: 'windows-x64-12.18.2' }
    ),
    'Windows'
  )
}

main()
