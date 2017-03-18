import Router from 'koa-router'

let router = new Router()

router.get('/', async function (ctx, next) {
    ctx.body = {hello: 'world'}
})

export default router
