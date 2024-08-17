import { getService, getMongoDb } from '../src/index.js'

getService()
  .module('./example/route_1')
  .start()

// getMongoDb().then(async (db) => {
//   const resp = await db.collection('kv').findOne({})
//   console.log('>>>', resp)
// })
