import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [socketReady, setSocketReady] = useState(false);

  // 🔥 NEW: online users state
  const [onlineUsers, setOnlineUsers] = useState([]);

  // GET CURRENT USER
  useEffect(() => {
    const fetchUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        const user = await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        setCurrentUser(user);
      }
    };

    fetchUser();
  }, [navigate]);

  // SOCKET CONNECTION
  useEffect(() => {
    if (currentUser && !socket.current) {
      socket.current = io(host);

      socket.current.on("connect", () => {
        console.log("Connected:", socket.current.id);

        socket.current.emit("add-user", currentUser._id);
        setSocketReady(true);
      });

      // 🔥 RECEIVE ONLINE USERS
      socket.current.on("online-users", (users) => {
        console.log("Online users:", users);
        setOnlineUsers(users);
      });
    }
    return () => {
      socket.current?.disconnect();
    };
  }, [currentUser]);

  // FETCH CONTACTS
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const data = await axios.get(
            `${allUsersRoute}/${currentUser._id}`
          );
          setContacts(data.data);
        } else {
          navigate("/setAvatar");
        }
      }
    };

    fetchContacts();
  }, [currentUser, navigate]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <>
      <Container>
        <div className="container">
          <Contacts
            contacts={contacts}
            changeChat={handleChatChange}
            socket={socket}
            socketReady={socketReady}
            onlineUsers={onlineUsers}   // 🔥 PASS THIS
          />

          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer
              currentChat={currentChat}
              socket={socket}
              socketReady={socketReady}
              onlineUsers={onlineUsers} // 🔥 PASS THIS
            />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;

  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;