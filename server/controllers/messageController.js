const Messages = require("../models/messageModel");

// GET MESSAGES
module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: { $all: [from, to] },
    }).sort({ createdAt: 1 });

    const projectedMessages = messages.map((msg) => ({
      _id: msg._id,
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
      read: msg.read,
      createdAt: msg.createdAt,
    }));

    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

// ADD MESSAGE
module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      read: false,
    });

    if (data) {
      // Notify recipient in real-time if online
      if (global.io) {
        const userSockets = global.onlineUsers.get(to);
        if (userSockets) {
          userSockets.forEach((sockId) =>
            global.io.to(sockId).emit("msg-recieve", message)
          );
        }
      }

      return res.json({
        msg: "Message added successfully.",
        _id: data._id,
        createdAt: data.createdAt,
      });
    } else {
      return res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    next(ex);
  }
};

// DELETE MESSAGE
module.exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedMsg = await Messages.findByIdAndDelete(id);
    if (!deletedMsg) return res.status(404).json({ msg: "Message not found" });

    // Notify all other users in this chat
    if (global.io && deletedMsg.users) {
      deletedMsg.users.forEach((userId) => {
        if (userId.toString() !== deletedMsg.sender.toString()) {
          const userSockets = global.onlineUsers.get(userId.toString());
          if (userSockets) {
            userSockets.forEach((sockId) =>
              global.io.to(sockId).emit("msg-deleted", { messageId: id })
            );
          }
        }
      });
    }

    res.json({ msg: "Message deleted successfully.", _id: id });
  } catch (ex) {
    next(ex);
  }
};

// MARK AS READ
module.exports.markAsRead = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    await Messages.updateMany(
      { sender: from, users: { $all: [from, to] }, read: false },
      { $set: { read: true } }
    );

    // Notify sender immediately
    if (global.io) {
      const userSockets = global.onlineUsers.get(from);
      if (userSockets) {
        userSockets.forEach((sockId) =>
          global.io.to(sockId).emit("msg-read-confirm", { from: to })
        );
      }
    }

    res.json({ msg: "Messages marked as read." });
  } catch (ex) {
    next(ex);
  }
};