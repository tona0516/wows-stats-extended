const nexe = require('nexe')

const baseSetting = {
  input: './bin/www',
  resouces: [
    'public/',
    'views/'
  ]
}

const build = (setting) => {
  nexe.compile(setting).catch(err => {
    console.log(`Failed to build: ${err}`)
  })
}

const main = () => {
  const packageJson = require('../package.json')

  build(
    Object.assign(
      baseSetting,
      {
        target: 'mac-x64-12.18.2',
        output: `wows-stats-extended-for-mac-${packageJson.version}`
      }
    ),
    'mac'
  )
  build(
    Object.assign(
      baseSetting,
      {
        target: 'windows-x64-12.18.2',
        output: `wows-stats-extended-for-windows-${packageJson.version}`
      }
    ),
    'windows'
  )
}

main()
