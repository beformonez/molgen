const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { 
    cors: { origin: "*" },
    pingInterval: 2500,
    pingTimeout: 5000
});

// PUBLIC folder serve
app.use(express.static(__dirname + '/../public'));

let players = {};

io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    // Spawn new player
    players[socket.id] = {
        x: Math.random() * 500 + 50,
        y: 400,
        width: 40,
        height: 40,
        color: "hsl(" + Math.random()*360 + ",80%,60%)",
        health: 100,
        alive: true
    };

    // Send player list only to new player
    socket.emit("players", players);

    // Broadcast new player to others
    socket.broadcast.emit("newPlayer", { id: socket.id, data: players[socket.id] });

    // Movement update (optimized)
    socket.on('playerMove', data => {
        const p = players[socket.id];
        if (!p || !p.alive) return;

        p.x = data.x;
        p.y = data.y;
    });

    // Attack
    socket.on('attack', () => {
        const atk = players[socket.id];
        if (!atk || !atk.alive) return;

        for (let id in players) {
            if (id === socket.id) continue;
            const p = players[id];
            if (!p.alive) continue;

            // hit detection
            const dx = Math.abs(atk.x - p.x);
            const dy = Math.abs(atk.y - p.y);

            if (dx < 60 && dy < 60) {
                p.health -= 20;

                if (p.health <= 0) {
                    p.alive = false;
                    p.health = 0;

                    // respawn
                    setTimeout(() => {
                        p.alive = true;
                        p.health = 100;
                        p.x = Math.random()*500+100;
                        p.y = 400;
                    }, 2500);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
        console.log("Player disconnected:", socket.id);
    });
});

// Send world update 20 times/sec
setInterval(() => {
    io.emit("state", players);
}, 50);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));