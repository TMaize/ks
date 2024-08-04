import { getService } from '../src/index.js'

const { router } = getService()

router.get('/ping', async (ctx, next) => {
  ctx.body = { code: '200', username: ctx.state.username }
})

router.post('/api/login', async (ctx, next) => {
  const body = ctx.request.body
  if (!body.username) {
    ctx.throw(400, 'username is required')
  }
  ctx.body = {
    code: '200',
    token: ctx.createToken(body.username)
  }
})
