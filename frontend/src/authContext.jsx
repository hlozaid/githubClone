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
    let socket;
    let handleConnect;

    if (!currentUser) return undefined;

    getSocket()
      .then((connectedSocket) => {
        if (cancelled) return;

        socket = connectedSocket;
        socket.auth = { token: localStorage.getItem("token") || "" };

        handleConnect = () => socket.emit("joinRoom");
        socket.on("connect", handleConnect);

        if (!socket.connected) {
          socket.connect();
        } else {
          handleConnect();
        }
      })
      .catch((error) => {
        console.error("Socket connection failed:", error.message);
      });

    return () => {
      cancelled = true;
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        socket.disconnect();
      }
    };
  }, [currentUser]);

  const value = { currentUser, setCurrentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
