import { MongoClient, Db, DbOptions } from 'mongodb'
import { getConfig } from './config.js'
import event from './event.js'

interface IState {
  client: null | Promise<MongoClient>
}

const state: IState = {
  client: null
}

function getMongoClient(): Promise<MongoClient> {
  if (!state.client) {
    const config = getConfig()
    state.client = new Promise<MongoClient>((resolve, reject) => {
      if (!config.mongo || !config.mongo.url) {
        reject(new Error('MongoDB URL not found in config'))
        return
      }
      const client = new MongoClient(config.mongo.url, { serverSelectionTimeoutMS: 6000 })
      client.connect().then(() => {
        event.on('SIGINT', () => {
          console.log('[KS]', 'close mongo')
          return client.close()
        })
        resolve(client)
      }).catch(err => {
        state.client = null
        reject(err)
      })
    })
  }

  return state.client
}

function getMongoDb(options?: DbOptions): Promise<Db> {
  const config = getConfig()
  const db = config.mongo?.defaultDb
  if (!db) {
    throw new Error('MongoDB defaultDb not found in config')
  }
  return getMongoClient().then(client => client.db(db, options))
}

async function withTempMongoClient<T = void>(callback: (c: MongoClient) => Promise<T>): Promise<T> {
  let client: MongoClient | null = null
  try {
    const config = getConfig()
    if (!config.mongo || !config.mongo.url) {
      throw new Error('MongoDB URL not found in config')
    }
    client = new MongoClient(config.mongo.url)
    await client.connect()
    return await callback(client)
  } finally {
    if (client) {
      client.close().catch(() => { })
    }
  }
}

async function withTempMongoDb<T = void>(callback: (db: Db) => Promise<T>): Promise<T> {
  return withTempMongoClient<T>(async (client) => {
    const config = getConfig()
    const db = config.mongo?.defaultDb
    if (!db) {
      throw new Error('MongoDB defaultDb not found in config')
    }
    return await callback(client.db(db))
  })
}

export {
  getMongoClient,
  getMongoDb,
  withTempMongoClient,
  withTempMongoDb
}