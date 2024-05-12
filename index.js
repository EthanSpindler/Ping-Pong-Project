// IT325 Fall 2023
// Ethan Spindler
// 12/11/23
// Project 3

const express = require("express");
const path = require("path");
const app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;
const production = false;
var finished = false;
var numOfPlayers = 0;

app.use(express.static(path.join(__dirname, "./static")));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "./index.html");
});

// var clients = new Map();
var clientId = 1;

function aKey(aSocket) {
    if (production) return aSocket.handshake.address;
    else return aSocket.id;
}

let rooms = [];

io.on('connection', (socket) => {
    console.log(`Player ${clientId} has joined!`);
    clientId++;
    

    socket.on("join", () => {
        console.log(rooms);

        // get room 
        let room;
        if (rooms.length > 0 && rooms[rooms.length - 1].players.length === 1) {
            room = rooms[rooms.length - 1];
            console.log(`this is room: ${rooms.length}`);
        }

        if (room) {
            socket.join(room.id);
            socket.emit('playerNo', 2);

            // add player to room
            room.players.push({
                socketID: socket.id,
                playerNo: 2,
                score: 0,
                x: 690,
                y: 200,
            });

            // send message to room
            io.to(room.id).emit('startingGame');

            setTimeout(() => {
                io.to(room.id).emit('startedGame', room);

                // start game
                startGame(room);
            }, 3000);
        }
        else {
            room = {
                id: rooms.length + 1,
                players: [{
                    socketID: socket.id,
                    playerNo: 1,
                    score: 0,
                    x: 90,
                    y: 200,
                }],
                ball: {
                    x: 395,
                    y: 245,
                    dx: Math.random() < 0.5 ? 1 : -1,
                    dy: 0,
                },
                winner: 0,
            }
            rooms.push(room);
            socket.join(room.id);
            socket.emit('playerNo', 1);
        }
    });

    socket.on("move", (data) => {
        let room = rooms.find(room => room.id === data.roomID);

        if (room) {
            if (data.direction === 'up') {
                room.players[data.playerNo - 1].y -= 10;

                if (room.players[data.playerNo - 1].y < 0) {
                    room.players[data.playerNo - 1].y = 0;
                }
            }
            else if (data.direction === 'down') {
                room.players[data.playerNo - 1].y += 10;

                if (room.players[data.playerNo - 1].y > 440) {
                    room.players[data.playerNo - 1].y = 440;
                }
            }
        }

        // update rooms
        rooms = rooms.map(r => {
            if (r.id === room.id) {
                return room;
            }
            else {
                return r;
            }
        });

        io.to(room.id).emit('updateGame', room);
    });

    socket.on("leave", (roomID) => {
        socket.leave(roomID);
    });



    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

function startGame(room) {
    let interval = setInterval(() => {
        room.ball.x += room.ball.dx * 5;
        room.ball.y += room.ball.dy * 5;

        // check if ball hits player 1
        if (room.ball.x < 110 && room.ball.y > room.players[0].y && room.ball.y < room.players[0].y + 60) {
            room.ball.dx = 1;

            // change ball direction
            if (room.ball.y < room.players[0].y + 30) {
                room.ball.dy = -1;
            }
            else if (room.ball.y > room.players[0].y + 30) {
                room.ball.dy = 1;
            }
            else {
                room.ball.dy = 0;
            }
        }

        // check if ball hits player 2
        if (room.ball.x > 690 && room.ball.y > room.players[1].y && room.ball.y < room.players[1].y + 60) {
            room.ball.dx = -1;

            // change ball direction
            if (room.ball.y < room.players[1].y + 30) {
                room.ball.dy = -1;
            }
            else if (room.ball.y > room.players[1].y + 30) {
                room.ball.dy = 1;
            }
            else {
                room.ball.dy = 0;
            }
        }

        // up and down walls
        if (room.ball.y < 5 || room.ball.y > 490) {
            room.ball.dy *= -1;
        }


        // left and right walls
        if (room.ball.x < 5) {
            room.players[1].score += 1;
            room.ball.x = 395;
            room.ball.y = 245;
            room.ball.dx = 1;
            room.ball.dy = 0;
        }

        if (room.ball.x > 795) {
            room.players[0].score += 1;
            room.ball.x = 395;
            room.ball.y = 245;
            room.ball.dx = -1;
            room.ball.dy = 0;
        }


        if (room.players[0].score === 10) {
            room.winner = 1;
            rooms = rooms.filter(r => r.id !== room.id);
            io.to(room.id).emit('endGame', room);
            clearInterval(interval);
        }

        if (room.players[1].score === 10) {
            room.winner = 2;
            rooms = rooms.filter(r => r.id !== room.id);
            io.to(room.id).emit('endGame', room);
            clearInterval(interval);
        }

        io.to(room.id).emit('updateGame', room);
    }, 1000 / 60);
}

http.listen(port, function () {
    console.log("Welcome to IT325!!");
    console.log("listening on port " + port);
});
