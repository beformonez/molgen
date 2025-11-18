const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" }});

app.use(express.static(__dirname + '/../public'));

let players = {};

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    // New player
    players[socket.id] = {
        x: 100,
        y: 400,
        width: 40,
        height: 40,
        color: 'red',
        health: 100
    };

    // Send all players to everyone
    io.emit('players', players);

    // Player moves
    socket.on('playerMove', data => {
        if(players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
        io.emit('players', players);
    });

    // Disconnect
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        console.log('Player disconnected:', socket.id);
    });
});

http.listen(3000, () => console.log('Server running on port 3000'));
