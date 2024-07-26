import { getDefaultService } from '../src/index'

const { router } = getDefaultService()

router.get('/ping', async (ctx, next) => {
  ctx.body = { code: '200' }
})

router.post('/ping', async (ctx, next) => {
  console.log('>>>', ctx.request.body)
  ctx.body = { code: '200' }
})
