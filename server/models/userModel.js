const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 20,
      trim: true, // ✅ removes spaces
    },

    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ], // ✅ validation
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    isAvatarImageSet: {
      type: Boolean,
      default: false,
    },

    avatarImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // ✅ VERY IMPORTANT
  }
);

// ✅ indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("Users", userSchema);