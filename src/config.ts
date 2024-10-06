import YAML from 'yaml'
import fs from 'fs'
import path from 'path'

interface KsConfig {
  service?: {
    port?: number
    cors?: {
      enable: boolean
      origins?: Array<string>
    }
    auth?: {
      enable: boolean
      secret: string
      whiteList?: Array<string>
    }
  }
  mongo?: {
    url: string
    defaultDb: string
  }
  [key: string]: any
}

let ksConfig: KsConfig

function getConfig(): KsConfig {
  if (ksConfig) {
    return ksConfig
  }

  let config = {}
  let files = ['./config.yml', './config.yaml']
  if (process.env.KS_CONFIG_FILE) {
    files = [process.env.KS_CONFIG_FILE]
  }

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i]
    const result = /^--config=(.+)$/.exec(arg)
    if (result) {
      files = [result[1]]
      break
    }
  }

  for (let i = 0; i < files.length; i++) {
    const file = path.resolve(files[i]);
    if (fs.existsSync(file)) {
      console.log('[KS]', 'use config', files[i])
      config = YAML.parse(fs.readFileSync(file, 'utf8'))
      break
    }
  }

  ksConfig = config
  return config
}

export {
  getConfig,
}