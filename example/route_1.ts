import { getService } from '../src/service.js'
import { getMongoClient } from '../src/mongo.js'

const { router } = getService()

router.get('/ping', async (ctx, next) => {
  ctx.body = { code: '200', username: ctx.state.username }
})

router.post('/api/login', async (ctx, next) => {
  const body = ctx.request.body || {}
  if (!body.username) {
    ctx.throw(400, 'username is required')
  }
  ctx.body = {
    code: '200',
    token: ctx.createToken(body.username)
  }
})

router.get('/api/db', async (ctx, next) => {
  const db = await getMongoClient()

  ctx.body = {
    code: '200',
    data: await db.db('test').collection('test').find().toArray()
  }
})

router.post('/api/error', async (ctx, next) => {
  ctx.request.body
  throw new Error('test error')
})