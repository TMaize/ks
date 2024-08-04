import { getService, getConfig } from '../src/index.js'

const config = getConfig('./example/config.yml')

getService()
  .cors()
  .auth(config.auth.secret, config.auth.whiteList)
  .scanRoute('./example')
  .start()
