import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import axios from "axios";
import { logoutRoute } from "../utils/APIRoutes";

export default function Logout({ socket }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      if (!user) return;

      const id = user._id;

      // Disconnect socket cleanly
      if (socket && socket.current) {
        socket.current.disconnect();
      }

      // Call logout API
      const res = await axios.get(`${logoutRoute}/${id}`);

      if (res.status === 200) {
        localStorage.clear();
        navigate("/login");
      } else {
        // fallback
        localStorage.clear();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);

      // fallback safety
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <Button onClick={handleClick}>
      <BiPowerOff />
    </Button>
  );
}

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #0066ff;
  border: none;
  cursor: pointer;

  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;