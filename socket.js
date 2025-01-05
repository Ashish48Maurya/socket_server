import express from "express";
import { Server } from "socket.io";
import http from "http";

export const app = express();
export const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI
    },
});

const users = [];
function userJoin(id, userId, room) {
    const user = { id, userId, room };
    users.push(user);
    return user;
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getRoomUsers(room) {
    return users.filter(user => user.room === room)
}

io.on("connection", (socket) => {
    socket.on("joinRoom", ({ userId, room }) => {
        const user = userJoin(socket.id, userId, room);
        socket.join(user?.room);
        io.to(room).emit("roomUsers", { room, users: getRoomUsers(room) });
    })

    socket.on("sendMessage", (messageData) => {
        const { room, message, createdAt, user } = messageData;
        if (room) {
            io.to(room).emit("receiveMessage", { message, room, createdAt, user, senderId: socket.id });
        } else {
            console.error("Room not specified for sendMessage");
        }
    });

    socket.on("typing", ({ userId, room }) => {
        io.to(room).emit("userTyping", { userId });
    });

    socket.on("stopTyping", ({ userId, room }) => {
        io.to(room).emit("userStoppedTyping", { userId });
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user?.room).emit("roomUsers", { room: user.room, users: getRoomUsers(user.room) });
        }
    })
});
