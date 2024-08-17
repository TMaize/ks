import { MongoClient, Db, DbOptions } from 'mongodb'

import { getConfig } from './config.js'

let client: null | Promise<MongoClient> = null

function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client
  }

  const config = getConfig()

  client = new Promise<MongoClient>(async (resolve, reject) => {

    if (!config.mongo || !config.mongo.url) {
      reject(new Error('MongoDB URL not found in config'))
      return
    }

    const client = new MongoClient(config.mongo.url)
    try {
      await client.connect()
      resolve(client)
    } catch (err) {
      reject(err)
    }
  })

  return client
}

function getMongoDb(dbName?: string, options?: DbOptions): Promise<Db> {
  const config = getConfig()
  const db = dbName || config.mongo?.defaultDb
  return getMongoClient().then(client => client.db(db, options))
}

export {
  getMongoClient,
  getMongoDb
}