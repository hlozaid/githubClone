
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

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
        <Link to="/create">
          <p>Create a Repository</p>
        </Link>

        <Link to="/profile">
          <p>Profile</p>
        </Link>

        {username && (
          <div className="navbar-user">
            <span className="navbar-username">
              Hi, {username}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
