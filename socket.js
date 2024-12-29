import express from "express";
import { Server } from "socket.io";
import http from "http";

export const app = express();
export const server = http.createServer(app);

const userSocketMap = {};

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI,
        credentials: true,
    },
});

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    socket.on("joinRoom", (room) => {
        socket.join(room);
        const roomSockets = io.sockets.adapter.rooms.get(room) || new Set();
        const usersInRoom = Array.from(roomSockets).map((socketId) =>
            Object.keys(userSocketMap).find((key) => userSocketMap[key] === socketId)
        );
        io.to(room).emit("roomUsers", usersInRoom);
    });

    socket.on("sendMessage", (messageData) => {
        const { room, message, createdAt, user } = messageData;
        if (room) {
            io.to(room).emit("receiveMessage", { message, createdAt, user, senderId: socket.id });
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

    socket.on("disconnect", () => {
        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
        }
       //handle roomUsers after socket disconnect
    });
});
