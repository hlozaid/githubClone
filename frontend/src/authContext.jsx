import React, { createContext, useState, useEffect, useContext } from "react";
import { getSocket } from "./socket";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) setCurrentUser(userId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!currentUser) return undefined;

    getSocket()
      .then((socket) => {
        if (cancelled) return;
        socket.auth = { token: localStorage.getItem("token") || "" };

        if (!socket.connected) socket.connect();

        socket.off("connect", handleConnect);
        function handleConnect() {
          socket.emit("joinRoom");
        }

        socket.on("connect", handleConnect);
        if (socket.connected) socket.emit("joinRoom");
      })
      .catch((error) => {
        console.error("Socket connection failed:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const value = { currentUser, setCurrentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
