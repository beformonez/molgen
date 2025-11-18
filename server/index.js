const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname + '/../public'));

let players = {};

io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    players[socket.id] = {
        x: Math.random()*700+50,
        y: 400,
        width: 40,
        height: 40,
        color: 'red',
        health: 100,
        alive: true
    };

    io.emit('players', players);

    // Player movement
    socket.on('playerMove', data => {
        if(players[socket.id] && players[socket.id].alive){
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
        io.emit('players', players);
    });

    // Player attack
    socket.on('attack', () => {
        const attacker = players[socket.id];
        if(!attacker || !attacker.alive) return;
        for(let id in players){
            if(id !== socket.id && players[id].alive){
                const p = players[id];
                // Simple hitbox check
                if(Math.abs(attacker.x - p.x) < 50 && Math.abs(attacker.y - p.y) < 50){
                    p.health -= 20;
                    if(p.health <= 0){
                        p.alive = false;
                        p.health = 0;
                        // respawn after 3 sec
                        setTimeout(()=>{p.alive=true; p.health=100; p.x=100; p.y=400;},3000);
                    }
                }
            }
        }
        io.emit('players', players);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        console.log('Player disconnected:', socket.id);
    });
});

http.listen(3000, ()=>console.log('Server running on http://localhost:3000'));