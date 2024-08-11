import Koa from 'koa'
import path from 'path'
import fs from 'fs'
import Router from '@koa/router'
import { koaBody } from 'koa-body'
import { fileURLToPath } from 'url'

import { getIPAdress, jwtDecode, jwtSign } from './util.js'
import { getKsConfig } from './config.js'

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url))

const store = new Map<string, Service>()

interface IConfig {
  port: number
  cors: {
    enable: boolean
    origins: string[]
  }
  auth: {
    enable: boolean
    secret: string
    whiteList: string[]
  }
  modules: string[]
}

interface KoaState {
  username?: string
}

interface KoaContext {
  createToken: (username: string) => string;
}

function startApp(app: Koa<any, any>, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    app.listen(port, '0.0.0.0', () => {
      console.log('[KS]', `access http://127.0.0.1:${port}`)
      try {
        getIPAdress().forEach(ip => {
          console.log('[KS]', `access http://${ip}:${port}`)
        })
      } catch (error) {
        // ignore
      }
      resolve()
    }).on('error', reject)
  })
}

class Service {
  private app: Koa<KoaState, KoaContext>
  private config: IConfig
  public router: Router<KoaState, KoaContext>

  constructor() {
    this.app = new Koa()

    this.router = new Router({ strict: true })

    const config = getKsConfig()

    this.config = {
      port: 3000,
      cors: { enable: false, origins: ['*'] },
      auth: { enable: false, secret: '', whiteList: [] },
      modules: [],
    }

    // assign config
    if (config.service?.port) {
      this.config.port = config.service.port
    }
    if (config.service?.cors?.enable) {
      this.config.cors.enable = true
    }
    if (Array.isArray(config.service?.cors?.origins)) {
      this.config.cors.origins = config.service.cors.origins
    }
  }

  port(port: number) {
    if (!port) {
      throw new Error('port must be set')
    }
    this.config.port = port
    return this
  }

  cors(enable: boolean, origins?: Array<string>) {
    this.config.cors.enable = enable
    if (Array.isArray(origins)) {
      this.config.cors.origins = origins
    }
    return this
  }

  auth(secret: string, whiteList?: string[]) {
    if (!secret) {
      throw new Error('secret must be set')
    }
    this.config.auth.enable = true
    this.config.auth.secret = secret
    if (Array.isArray(whiteList)) {
      this.config.auth.whiteList = whiteList
    }
    return this
  }

  module(file: string) {
    let f = file

    if (!file.endsWith('.js') && fs.existsSync(file + '.js')) {
      f = file + '.js'
    } else if (!file.endsWith('.ts') && fs.existsSync(file + '.ts')) {
      f = file + '.ts'
    }

    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) {
      throw new Error(`module ${file} not found`)
    }
    const modulePath = path.resolve(f).replace(/\.(ts|js)$/, '')
    if (!this.config.modules.includes(modulePath)) {
      this.config.modules.push(modulePath)
    }
    return this
  }

  async start(): Promise<void> {

    console.log('[KS]', 'service.port', JSON.stringify(this.config.port))

    // config cors
    console.log('[KS]', 'service.cors', JSON.stringify(this.config.cors))
    if (this.config.cors.enable) {
      this.app.use(async (ctx, next) => {
        const origin = ctx.header.origin || ''
        const allow = this.config.cors.origins.find(item => item === '*' || item === origin)
        if (origin && allow) {
          ctx.set('Access-Control-Allow-Origin', origin)
          ctx.set('Access-Control-Allow-Credentials', 'true')

          if (ctx.method === 'OPTIONS') {
            ctx.set('Access-Control-Allow-Methods', ctx.header['access-control-request-method'] || '')
            ctx.set('Access-Control-Allow-Headers', ctx.header['access-control-request-headers'] || '')
            ctx.set('Access-Control-Max-Age', '180')
            ctx.status = 200
            return
          }
        }

        await next()
      })
    }

    // config auth
    if (this.config.auth.enable) {
      this.app.use(async (ctx, next) => {
        const whiteList = this.config.auth.whiteList
        const authorization = (ctx.get('Authorization') || '').replace(/^Bearer /, '')
        const result = jwtDecode(authorization, this.config.auth.secret)
        if (!whiteList.includes(ctx.path) && (!result || !result.username)) {
          ctx.throw(401, 'please login')
        }
        ctx.state.username = result?.username
        await next()
      })
    }
    this.app.context.createToken = (username: string) => {
      if (!this.config.auth.secret) {
        throw new Error('createToken: auth must be init')
      }
      if (!username) {
        throw new Error('createToken: username must be set')
      }
      return jwtSign({ username }, this.config.auth.secret)
    }

    // use koa body
    this.app.use(koaBody({ multipart: true }))

    // scan router
    for (let i = 0; i < this.config.modules.length; i++) {
      const modulePath = this.config.modules[i]
      console.log('[KS]', 'load module', path.relative('./', modulePath).replace(/\\/g, '/'))
      await import(path.relative(BASE_DIR, modulePath).replace(/\\/g, '/'))
    }

    // register router
    this.app.use(this.router.routes())

    await startApp(this.app, this.config.port)
  }
}

function createService(name: string) {
  if (store.has(name)) {
    throw new Error(`service ${name} already exists`)
  }
  const service = new Service()
  store.set(name, service)
  return service
}

function getService(name?: string): Service {
  const serviceName = name || 'default'

  if (serviceName === 'default') {
    return store.get('default') || createService('default')
  }

  const service = store.get(serviceName)
  if (!service) {
    throw new Error(`service ${name} not found`)
  }

  return service
}

export {
  createService,
  getService
}
