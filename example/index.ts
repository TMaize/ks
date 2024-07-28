import { getDefaultService, getConfig } from '../src/index.js'

const config = getConfig('./example/config.yml')

console.log(config)

getDefaultService()
  .cors()
  .auth()
  .scanRoute('./example')
  .start()
