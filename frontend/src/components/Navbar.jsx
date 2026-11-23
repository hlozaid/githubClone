import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { getSocket } from "../socket";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const username = localStorage.getItem("username");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let active = true;
    let socket;

    getSocket()
      .then((connectedSocket) => {
        if (!active) return;
        socket = connectedSocket;

        const handleNotification = (notification) => {
          setNotifications((current) => [
            { ...notification, localId: Date.now() + Math.random() },
            ...current,
          ].slice(0, 8));
        };

        socket.on("notification", handleNotification);
        socket.__navbarNotificationHandler = handleNotification;
      })
      .catch((error) => {
        console.error("Notification socket error:", error.message);
      });

    return () => {
      active = false;
      if (socket && socket.__navbarNotificationHandler) {
        socket.off("notification", socket.__navbarNotificationHandler);
        delete socket.__navbarNotificationHandler;
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setCurrentUser(null);
    navigate("/auth");
  };

  return (
    <nav>
      <Link to="/" className="navbar-brand">
        <div>
          <img
            src="https://www.github.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub Logo"
          />
          <h3 className="github">GitHub</h3>
        </div>
      </Link>

      <div className="navbar-links">
        <Link to="/create"><p>Create a Repository</p></Link>
        <Link to="/profile"><p>Profile</p></Link>

        {username && (
          <div className="navbar-user">
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowNotifications((visible) => !visible)}
                aria-label="Notifications"
                style={{ cursor: "pointer", padding: "8px 12px" }}
              >
                Notifications {notifications.length > 0 ? "(" + notifications.length + ")" : ""}
              </button>

              {showNotifications && (
                <div
                  role="region"
                  aria-label="Recent notifications"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 1000,
                    width: "300px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    padding: "12px",
                    background: "#fff",
                    color: "#24292f",
                    border: "1px solid #d0d7de",
                    borderRadius: "8px",
                    boxShadow: "0 8px 24px rgba(140,149,159,.2)",
                  }}
                >
                  <strong>Recent activity</strong>
                  {notifications.length === 0 ? (
                    <p>No new notifications.</p>
                  ) : (
                    notifications.map((item) => (
                      <p key={item.localId} style={{ borderBottom: "1px solid #d8dee4", padding: "8px 0", margin: 0 }}>
                        {item.message || "Repository activity"}
                      </p>
                    ))
                  )}
                  {notifications.length > 0 && (
                    <button type="button" onClick={() => setNotifications([])}>
                      Clear notifications
                    </button>
                  )}
                </div>
              )}
            </div>

            <span className="navbar-username">Hi, {username}</span>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
