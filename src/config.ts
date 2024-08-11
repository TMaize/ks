import YAML from 'yaml'
import fs from 'fs'
import path from 'path'

const store = new Map<string, any>()

interface KsConfig {
  service?: {
    port?: number
    cors?: {
      enable: boolean
      origins?: Array<string>
    }
  }
  mongo?: {
    uri: string
  }
}

let ksConfig: KsConfig

function getKsConfig(): KsConfig {
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

function getConfig<T = any>(file: string): T {
  const filePath = path.resolve(file);

  if (store.has(filePath)) {
    return store.get(filePath) as T
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('config file not found: ' + file)
  }

  const data = YAML.parse(fs.readFileSync(file, 'utf8'))
  store.set(file, data)

  return data
}

export {
  getKsConfig,
  getConfig
}