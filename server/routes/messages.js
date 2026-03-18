const { addMessage, getMessages, deleteMessage, markAsRead } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.delete("/deletemsg/:id", deleteMessage);
router.post("/markasread/", markAsRead);

module.exports = router;