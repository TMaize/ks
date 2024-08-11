import { MongoClient, ServerApiVersion } from 'mongodb'

import { getKsConfig } from './config.js'

let client: null | Promise<MongoClient> = null

function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client
  }

  const config = getKsConfig()

  client = new Promise<MongoClient>(async (resolve, reject) => {

    if (!config.mongo || !config.mongo.uri) {
      reject(new Error('MongoDB URI not found in config'))
      return
    }

    const client = new MongoClient(config.mongo.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })
    try {
      await client.connect()
      resolve(client)
    } catch (err) {
      reject(err)
    }
  })

  return client
}

export {
  getMongoClient
}