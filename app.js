require('babel-register');
import Koa from 'koa'
import convert from "koa-convert"
import cors from 'kcors'
import bodyParser from 'koa-bodyparser'
import onError from "koa-onerror"
import json from "koa-json"
import logger from "koa-logger"
import IO from 'koa-socket'
import uuid from 'node-uuid'

import router from "./routes"

const app = new Koa()
const io = new IO()

app.use(convert(cors()))
app.use(bodyParser())
app.use(json())
app.use(logger())

app.use(router.allowedMethods())
app.use(router.routes())

onError(app)
io.attach(app)

io.use(async (ctx, next) => {
    console.log(`From ${ctx.socket.id} - ${ctx.event}`)
    await next()
})

var rooms = {}

io.on('connection', (ctx, data) => {
    console.log(`${ctx.socket.id} connected`)
})

io.on('disconnect', (ctx, data) => {
    let {socket: {socket}} = ctx
    console.log(`${socket.id} disconnected`)
    if (socket.roomKey) {
        console.log(`Close room: ${rooms[socket.roomKey].title}`)
        delete rooms[socket.roomKey]
    }
})

io.on('create_room', (ctx, data) => {
    let {socket: {socket}} = ctx
    console.log(socket.join)
    console.log(`Create room: ${data.title}`)
    var roomKey = uuid.v4()
    rooms[roomKey] = data
    socket.roomKey = roomKey
    socket.join(roomKey)
})

router.get('/rooms', (ctx, next) => {
    ctx.body = rooms
})

app.listen(3000, () => console.log("Start on http://localhost:3000"))

export default app
