import { getService } from '../src/service.js'
import { getMongoDb } from '../src/mongo.js'
import './route_1.js'

getService()
  .start()

// getMongoDb().then(async (db) => {
//   const resp = await db.collection('kv').findOne({})
//   console.log('>>>', resp)
// })
