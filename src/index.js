const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
var Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const{addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const port=process.env.Port||3000
const app=express()
const server=http.createServer(app)
const io=socketio(server)
const publicDirPath=path.join(__dirname,'../public')
//Setup static directory to serve
app.use(express.static(publicDirPath))

app.get('task',(req,res)=>{
    res.render('index')
})

io.on('connection',(socket)=>{

    console.log("New Websocket Connection")
    
    socket.on('join',(options,callback)=>{
        const{error,user}=addUser({id:socket.id,...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

        io.to(user.room).emit('roomData',({
            room:user.room,
            users:getUsersInRoom(user.room)
        }))
    })

   
    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
       const filter=new Filter()
       if(filter.isProfane(message))
       {
           return callback('Profanity words are not allowed')
       }       
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect',()=>{     
            const user=removeUser(socket.id)
            if(user)
            {                
                io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
                io.to(user.room).emit('roomData',({
                    room:user.room,
                    users:getUsersInRoom(user.room)
                }))
            }

        })

    socket.on('sendLocation',(coords,callback)=>{   
       const user=getUser(socket.id)     
       io.to(user.room).emit('Locationmessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
       callback('Location Shared!')
    })
})

server.listen(3000,()=>{

    console.log(`Server is running on port :http://localhost:${port}/`)
})