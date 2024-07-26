import { getDefaultService, getConfig } from '../src/index'

const config = getConfig('./example/config.yml')

console.log(config)

getDefaultService()
  .cors()
  .auth()
  .scanRoute('./example')
  .start()
