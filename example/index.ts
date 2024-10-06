import { getService } from '../src/service.js'
import { getMongoDb } from '../src/mongo.js'

getService()
  .module('./example/route_1')
  .start()

// getMongoDb().then(async (db) => {
//   const resp = await db.collection('kv').findOne({})
//   console.log('>>>', resp)
// })
