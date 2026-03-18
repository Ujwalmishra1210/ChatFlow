import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import axios from "axios";
import {
  sendMessageRoute,
  receiveMessageRoute,
  deleteMessageRoute,
  markAsReadRoute,
} from "../utils/APIRoutes";
import { MdDelete } from "react-icons/md";
import { BsCheck, BsCheckAll } from "react-icons/bs";

export default function ChatContainer({ currentChat, socket, socketReady }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [typingUser, setTypingUser] = useState("");

  const localData = JSON.parse(
    localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
  );

  // LOAD MESSAGES
  const fetchMessages = async () => {
    if (!currentChat) return;
    const response = await axios.post(receiveMessageRoute, {
      from: localData._id,
      to: currentChat._id,
    });
    setMessages(response.data);

    // Mark as read
    await axios.post(markAsReadRoute, {
      from: currentChat._id,
      to: localData._id,
    });

    socket.current?.emit("msg-read", {
      to: currentChat._id,
      from: localData._id,
    });
  };

  useEffect(() => {
    fetchMessages();
  }, [currentChat]);

  // SEND MESSAGE
  const handleSendMsg = async (msg) => {
    const response = await axios.post(sendMessageRoute, {
      from: localData._id,
      to: currentChat._id,
      message: msg,
    });

    const messageData = {
      fromSelf: true,
      message: msg,
      _id: response.data._id,
      read: false,
      createdAt: new Date(),
    };

    // Update own UI
    setMessages((prev) => [...prev, messageData]);

    // Emit to socket
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: localData._id,
      msg,
      messageId: response.data._id,
    });
  };

  // DELETE MESSAGE
  const handleDeleteMsg = async (messageId) => {
    await axios.delete(`${deleteMessageRoute}/${messageId}`);
    socket.current.emit("delete-msg", { messageId, to: currentChat._id });
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  // SOCKET EVENTS
  useEffect(() => {
    if (!socketReady || !socket.current || !currentChat) return;

    socket.current.off("msg-recieve");
    socket.current.off("typing");
    socket.current.off("stop-typing");
    socket.current.off("msg-read-confirm");
    socket.current.off("msg-deleted");

    // NEW MESSAGE
    socket.current.on("msg-recieve", async (msg) => {
      setMessages((prev) => {
        // prevent duplicate / blank messages
        if (!msg.messageId || prev.some((m) => m._id === msg.messageId)) {
          return prev;
        }

        return [
          ...prev,
          {
            fromSelf: false,
            message: msg.msg,
            _id: msg.messageId,
            read: false,
            createdAt: new Date(),
          },
        ];
      });

      // Mark as read
      await axios.post(markAsReadRoute, {
        from: currentChat._id,
        to: localData._id,
      });

      socket.current.emit("msg-read", {
        from: localData._id,
        to: currentChat._id,
      });
    });

    // DELETE MESSAGE
    socket.current.on("msg-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    // TYPING
    socket.current.on("typing", ({ from }) => {
      if (from === currentChat._id) setTypingUser("Typing...");
    });

    socket.current.on("stop-typing", ({ from }) => {
      if (from === currentChat._id) setTypingUser("");
    });

    // READ RECEIPT
    socket.current.on("msg-read-confirm", ({ from }) => {
      if (from === currentChat._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.fromSelf ? { ...msg, read: true } : msg))
        );
      }
    });

    return () => {
      socket.current?.off("msg-recieve");
      socket.current?.off("typing");
      socket.current?.off("stop-typing");
      socket.current?.off("msg-read-confirm");
      socket.current?.off("msg-deleted");
    };
  }, [socketReady, currentChat]);

  // AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            {typingUser && <span className="typing-indicator">{typingUser}</span>}
          </div>
        </div>
        <Logout socket={socket} />
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div ref={scrollRef} key={message._id}>
            <div className={`message ${message.fromSelf ? "sended" : "recieved"}`}>
              {message.fromSelf && (
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteMsg(message._id)}
                >
                  <MdDelete />
                </button>
              )}
              <div className="content">
                <p>{message.message}</p>
                <div className="message-footer">
                  <span className="timestamp">
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                  {message.fromSelf && (
                    <span className={`read-receipt ${message.read ? "read" : ""}`}>
                      {message.read ? <BsCheckAll /> : <BsCheck />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ChatInput
        handleSendMsg={handleSendMsg}
        socket={socket}
        currentChat={currentChat}
      />
    </Container>
  );
}

// STYLED COMPONENT
const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;

    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar img {
        height: 3rem;
        width: 3rem;
        border-radius: 50%;
        object-fit: cover;
      }

      .username {
        h3 {
          color: white;
          margin: 0;
        }

        .typing-indicator {
          color: #0066ff;
          font-size: 0.8rem;
          font-style: italic;
        }
      }
    }
  }

  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;

    .message {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #ffffff50;
        display: none;

        &:hover {
          color: #ff4444;
        }
      }

      &:hover .delete-btn {
        display: block;
      }

      .content {
        max-width: 40%;
        padding: 1rem;
        border-radius: 1rem;
        color: #d1d1d1;

        .message-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.3rem;
        }

        .timestamp {
          font-size: 0.65rem;
          color: #ffffff60;
        }

        .read-receipt.read {
          color: #0066ff;
        }
      }
    }

    .sended {
      justify-content: flex-end;

      .content {
        background-color: #0066ff21;
      }
    }

    .recieved {
      justify-content: flex-start;

      .content {
        background-color: #0066ff15;
      }
    }
  }
`;