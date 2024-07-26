import YAML from 'yaml'
import fs from 'fs'
import path from 'path'

const store = new Map<string, any>()

function getConfig<T = any>(file?: string): T {
  let files = ['./config.yml', './config.yaml']
  if (file) {
    files = [file]
  }
  let lastFile = ''
  for (let i = 0; i < files.length; i++) {
    const file = path.resolve(files[i]);
    lastFile = files[i]

    if (store.has(file)) {
      return store.get(file) as T
    }

    if (fs.existsSync(file)) {
      const data = YAML.parse(fs.readFileSync(file, 'utf8'))
      store.set(file, data)
      return data
    }
  }
  throw new Error('config file not found: ' + path.resolve(lastFile).replace(/\\/g, '/'))
}

export {
  getConfig
}