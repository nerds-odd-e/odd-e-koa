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
        socket.broadcast.to(socket.roomKey).emit('close_room')
        delete rooms[socket.roomKey]
    }
})

io.on('create_room', (ctx, data) => {
    let {socket: {socket}} = ctx
    console.log(`Create room: ${data.title}`)
    var roomKey = uuid.v4()
    data.key = roomKey
    rooms[roomKey] = data
    socket.roomKey = roomKey
    socket.join(roomKey)
    console.log(`Room ready: ${data.key}`)
    socket.emit('room_ready', data)
})

io.on('join_room', (ctx, data) => {
    let {socket: {socket}} = ctx
    var room = rooms[data]
    console.log(`Join room: ${room.title}`)
    socket.join(room.key)
})

router.get('/rooms', (ctx, next) => {
    ctx.body = Object.values(rooms)
})

app.listen(3000, () => console.log("Start on http://localhost:3000"))

export default app
