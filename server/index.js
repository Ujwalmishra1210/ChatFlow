const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
const Message = require("./models/messageModel");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// DB CONNECTION
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log(err.message));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// SERVER
const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

// SOCKET.IO
const io = socket(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

global.io = io;
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ADD USER
  socket.on("add-user", (userId) => {
    if (!global.onlineUsers.has(userId)) {
      global.onlineUsers.set(userId, new Set());
    }
    global.onlineUsers.get(userId).add(socket.id);
    io.emit("online-users", Array.from(global.onlineUsers.keys()));
  });

  // SEND MESSAGE (fixed)
  socket.on("send-msg", async (data) => {
    const userSockets = global.onlineUsers.get(data.to);
    if (userSockets) {
      userSockets.forEach((sockId) => {
        socket.to(sockId).emit("msg-recieve", {
          from: data.from,
          msg: data.msg,
          messageId: data.messageId,
        });
      });
    }
  });

  // TYPING
  socket.on("typing", ({ to, from }) => {
    const userSockets = global.onlineUsers.get(to);
    if (userSockets) {
      userSockets.forEach((sockId) => socket.to(sockId).emit("typing", { from }));
    }
  });

  socket.on("stop-typing", ({ to, from }) => {
    const userSockets = global.onlineUsers.get(to);
    if (userSockets) {
      userSockets.forEach((sockId) =>
        socket.to(sockId).emit("stop-typing", { from })
      );
    }
  });

  // READ RECEIPT
  socket.on("msg-read", async ({ to, from }) => {
    try {
      await Message.updateMany(
        { sender: to, users: { $all: [to, from] }, read: false },
        { $set: { read: true } }
      );

      const userSockets = global.onlineUsers.get(to);
      if (userSockets) {
        userSockets.forEach((sockId) =>
          socket.to(sockId).emit("msg-read-confirm", { from })
        );
      }

      socket.emit("msg-read-confirm", { from: to });
    } catch (err) {
      console.log("Read receipt error:", err);
    }
  });

  // DELETE MESSAGE
  socket.on("delete-msg", async ({ messageId, to }) => {
    try {
      await Message.findByIdAndDelete(messageId);

      const userSockets = global.onlineUsers.get(to);
      if (userSockets) {
        userSockets.forEach((sockId) =>
          socket.to(sockId).emit("msg-deleted", { messageId })
        );
      }

      socket.emit("msg-deleted", { messageId });
    } catch (err) {
      console.log("Delete message error:", err);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let [userId, sockets] of global.onlineUsers.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) global.onlineUsers.delete(userId);
    }
    io.emit("online-users", Array.from(global.onlineUsers.keys()));
  });
});