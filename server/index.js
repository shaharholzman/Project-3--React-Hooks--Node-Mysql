// הרשאות לנוד
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

// גישה לראוטים
const users_router = require('./routers/users')
const admin_router = require('./routers/admin')

app.set('trust proxy',1)
// midelwear
app.use(cors({credentials:true,origin:'http://localhost:3000'}))
app.use(session({secret: 'keyboard cat', cookie: {maxAge:7200000,secure:false,saveUninitialized:true,resave:true }}))
// app.use(express.static('myapp/src'))
app.use(express.static('build'))
app.use(express.json())
app.use('/users',users_router)
app.use('/admin',admin_router)

app.get('/main/user',(req,res)=>{
  res.send('build')

})
io.on("connection",(socket) => {
    console.log("new user connected",socket.id)
   socket.on("disconnect", () => {
       console.log("user disconnect",socket.id)
   })
   socket.on("admin-change", () => {
       socket.broadcast.emit('admin-change')
       console.log("admin-change")
   })
   socket.on("user-change", () => {
       socket.broadcast.emit('user-change')
       console.log("user-change")
   })
   })

 http.listen(3000,_=> console.log('port 3000 working'))


