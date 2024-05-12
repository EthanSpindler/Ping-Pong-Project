// IT325 Fall 2023
// Ethan Spindler
// 12/11/23
// Project 3

//IDK how to do objects with basically a constructor so here you go
import Ball from "./ball.js";
import Player from "./player.js";
// const { Ball } = require('./ball');
// const { Player } = require('./player');

var socket = io();

//Game objects
let startBtn = document.getElementById('startBtn');
let message = document.getElementById('message');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
startBtn.addEventListener('click', startGame);
let player1;
let player2;
let ball;
let isGameStarted = false;
let playerNo = 0;
let roomID;

//Check for other player before starting
function startGame() {
    startBtn.style.display = 'none';

    if (socket.connected) {
        socket.emit('join');
        message.innerText = "Waiting for other player..."
    }
    else {
        message.innerText = "Refresh the page and try again..."
    }
}

//Set Player #
socket.on("playerNo", (newPlayerNo) => {
    console.log(newPlayerNo);
    playerNo = newPlayerNo;
});

//Initiate Game
socket.on("startingGame", () => {
    isGameStarted = true;
    message.innerText = "We are going to start the game...";
});

//User Input
socket.on("startedGame", (room) => {
    console.log(room);

    roomID = room.id;
    message.innerText = "";

    player1 = new Player(room.players[0].x, room.players[0].y, 20, 60, 'black');
    player2 = new Player(room.players[1].x, room.players[1].y, 20, 60, 'white');

    player1.score = room.players[0].score;
    player2.score = room.players[1].score;


    ball = new Ball(room.ball.x, room.ball.y, 10, 'blue');

    window.addEventListener('keydown', (e) => {
        if (isGameStarted) {
            if (e.keyCode === 38) {
                // console.log("player move 1 up")
                socket.emit("move", {
                    roomID: roomID,
                    playerNo: playerNo,
                    direction: 'up'
                })
            } else if (e.keyCode === 40) {
                // console.log("player move 1 down")
                socket.emit("move", {
                    roomID: roomID,
                    playerNo: playerNo,
                    direction: 'down'
                })
            }
        }
    });

    draw();
});

//Draw Movement
socket.on("updateGame", (room) => {
    player1.y = room.players[0].y;
    player2.y = room.players[1].y;

    player1.score = room.players[0].score;
    player2.score = room.players[1].score;

    ball.x = room.ball.x;
    ball.y = room.ball.y;

    draw();
});

//End
socket.on("endGame", (room) => {
    isGameStarted = false;
    message.innerText = `${room.winner === playerNo ? "You are Winner!" : "You are Loser!"}`;

    socket.emit("leave", roomID);


    setTimeout(() => {
        ctx.clearRect(0, 0, 800, 500);
        startBtn.style.display = 'block';
    }, 2000);
});



function draw() {
    ctx.clearRect(0, 0, 800, 500);


    player1.draw(ctx);
    player2.draw(ctx);
    ball.draw(ctx);

    // center line
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.setLineDash([10, 10])
    ctx.moveTo(400, 5);
    ctx.lineTo(400, 495);
    ctx.stroke();
}