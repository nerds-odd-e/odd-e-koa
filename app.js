require('babel-register');
import Koa from 'koa'
import convert from "koa-convert"
import cors from 'kcors'
import bodyParser from 'koa-bodyparser'
import onError from "koa-onerror"
import json from "koa-json"
import koaLogger from "koa-logger"
import IO from 'koa-socket'
import uuid from 'node-uuid'
import log4js from 'log4js'

import router from "./routes"

const PORT = 3000
const RTMP_URL = 'rtmp://ttq.iagile.me/live/'
const app = new Koa()
const io = new IO()
const logger = log4js.getLogger()

app.use(convert(cors()))
app.use(bodyParser())
app.use(json())
app.use(koaLogger())

app.use(router.allowedMethods())
app.use(router.routes())

onError(app)
io.attach(app)

io.use(async (ctx, next) => {
    logger.info(`From ${ctx.socket.id} - ${ctx.event}`)
    await next()
})

let rooms = {}

io.on('connection', (ctx, data) => {
    logger.info(`${ctx.socket.id} connected`)
})

io.on('disconnect', (ctx, data) => {
    let {socket: {socket}} = ctx
    logger.info(`${socket.id} disconnected`)
    if (socket.roomKey) {
        logger.info(`Close room: ${rooms[socket.roomKey].title}`)
        socket.broadcast.to(socket.roomKey).emit('close_room')
        delete rooms[socket.roomKey]
    }
})

io.on('create_room', (ctx, data) => {
    let {socket: {socket}} = ctx
    logger.info(`Create room: ${data.title}`)
    let roomKey = uuid.v4()
    data.key = roomKey
    data.url = `${RTMP_URL}${roomKey}`
    rooms[roomKey] = data
    socket.roomKey = roomKey
    socket.join(roomKey)
    logger.info(`Room ready: ${data.url}`)
    socket.emit('room_ready', data)
})

io.on('join_room', (ctx, data) => {
    let {socket: {socket}} = ctx
    let room = rooms[data]
    logger.info(`Join room: ${room.title}`)
    socket.join(room.key)
})

router.get('/rooms', (ctx, next) => {
    ctx.body = Object.values(rooms)
})

app.listen(PORT, () => logger.info(`Start on http://localhost:${PORT}`))

export default app
