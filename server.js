const express = require("express");
const app = express();
const dotenv = require('dotenv');
const connectDB = require("./Config/db");
const userRoutes = require('./Routes/userRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const cors = require('cors');

app.use(cors({
    origin: 'https://chatterdjd.netlify.app/'
}));

const port = process.env.PORT || 5000;
dotenv.config();
connectDB();
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.get('/api', (req, res) => {
    res.send("API is running.");
    console.log("API is running.");
});
const server = app.listen(port, console.log(`Server is running at port ${port}`));

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "https://chatterdjd.netlify.app/"
    }
});

io.on('connection', (socket) => {
    console.log("Connected to socket.io.");

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User joined Room: ' + room);
    });

    socket.on('new message', (newMessage) => {
        let chat = newMessage.chat;
        if (!chat.users)
            return console.log("chat.users not defined");
        chat.users.forEach(user => {
            if (user._id === newMessage.sender._id)
                return;
            socket.in(user._id).emit("message recieved", newMessage);
        });
    });

    socket.off('setup', () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});