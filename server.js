const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentuser, userLeave, getRoomUsers} = require('./utils/users')

const app = express();
const server = http.createServer(app)
const io = socketio(server);

//set static
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Chat Bots";

//Run when clients connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to the chat'))
    
        //BroadCast when a user connects
        socket.broadcast.
        to(user.room)
        .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    //listen to chatMessage

    socket.on('chatMessage', (msg) => {
        const user = getCurrentuser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    });
    
    
    ////Runs when client disconnect 
    socket.on('disconnect', ()=> {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        }
        

    });
});

const PORT = 3000 || process.env.PORT
server.listen(PORT, () => console.log(`server running on port ${PORT}!`));