const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    message: {
      text: {
        type: String,
        required: true,
      },
    },

    // ✅ better structure instead of plain array
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // ✅ required for chat apps
  }
);

// ✅ INDEX for faster queries
MessageSchema.index({ users: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Messages", MessageSchema);