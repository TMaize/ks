import Koa from 'koa'
import path from 'path'
import fs from 'fs'
import Router from '@koa/router'
import { koaBody } from 'koa-body'
import { fileURLToPath } from 'url'

import { getIPAdress, jwtDecode, jwtSign } from './util.js'

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url))

const store = new Map<string, Service>()

interface IConfig {
  port: number
  cors: {
    enable: boolean
    domains: string[]
  }
  auth: {
    enable: boolean
    secret: string
    whiteList: string[]
  }
  scanRoutes: string[]
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
      console.log('[KS]', `listen port ${port}`)
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

    this.config = {
      port: 8888,
      cors: { enable: false, domains: [] },
      auth: { enable: false, secret: '', whiteList: [] },
      scanRoutes: [],
    }
  }

  cors(domains?: Array<string>) {
    this.config.cors.enable = true
    if (Array.isArray(domains)) {
      this.config.cors.domains = domains
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

  scanRoute(dir: string) {
    if (!fs.existsSync(dir)) return this
    if (!fs.statSync(dir).isDirectory()) return this

    const names = fs.readdirSync(dir)
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      if (! /^route_.+\.(ts|js)$/.test(name)) continue
      const modulePath = path.resolve(path.join(dir, names[i])).replace(/\.(ts|js)$/, '')
      if (!this.config.scanRoutes.includes(modulePath)) {
        this.config.scanRoutes.push(modulePath)
      }
    }
    return this
  }

  port(port: number) {
    if (!port) {
      throw new Error('port must be set')
    }
    this.config.port = port
    return this
  }

  async start(): Promise<void> {
    // config cors
    if (this.config.cors.enable) {
      this.app.use(async (ctx, next) => {
        const origin = ctx.header.origin || ''
        const allow = this.config.cors.domains.length == 0 || this.config.cors.domains.includes(origin)
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
    for (let i = 0; i < this.config.scanRoutes.length; i++) {
      const modulePath = this.config.scanRoutes[i]
      console.log('[KS]', 'scanRoute', path.relative('./', modulePath).replace(/\\/g, '/'))
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
