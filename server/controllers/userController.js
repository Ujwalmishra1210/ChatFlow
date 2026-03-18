const User = require("../models/userModel");
const bcrypt = require("bcrypt");

// LOGIN
module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        msg: "Username and password required",
        status: false,
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        msg: "Incorrect Username or Password",
        status: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "Incorrect Username or Password",
        status: false,
      });
    }

    const userData = user.toObject();
    delete userData.password; // ✅ FIXED

    return res.status(200).json({
      status: true,
      user: userData,
    });
  } catch (ex) {
    next(ex);
  }
};

// REGISTER
module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        msg: "All fields are required",
        status: false,
      });
    }

    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) {
      return res.status(400).json({
        msg: "Username already used",
        status: false,
      });
    }

    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.status(400).json({
        msg: "Email already used",
        status: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    const userData = user.toObject();
    delete userData.password; // ✅ FIXED

    return res.status(201).json({
      status: true,
      user: userData,
    });
  } catch (ex) {
    next(ex);
  }
};

// GET ALL USERS
module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      _id: { $ne: req.params.id },
    }).select(["email", "username", "avatarImage", "_id"]);

    return res.status(200).json(users);
  } catch (ex) {
    next(ex);
  }
};

// SET AVATAR
module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );

    return res.status(200).json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

// LOGOUT
module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        msg: "User id is required",
      });
    }

    // ⚠️ only if you defined this globally in socket server
    if (global.onlineUsers) {
      global.onlineUsers.delete(req.params.id);
    }

    return res.status(200).json({
      msg: "Logged out successfully",
    });
  } catch (ex) {
    next(ex);
  }
};