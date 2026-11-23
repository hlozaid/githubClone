import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar";
import { useAuth } from "../../authContext";
import HeatMapProfile from "./HeatMap";
import API_URL from "../../config";

import {
  BookIcon,
  RepoIcon,
  StarIcon,
  PeopleIcon,
  PlusIcon,
  SearchIcon,
} from "@primer/octicons-react";

const Profile = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const [userDetails, setUserDetails] = useState({});
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [repoType, setRepoType] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        navigate("/auth");
        return;
      }

      try {
        const [userResponse, repoResponse] = await Promise.all([
          axios.get(`${API_URL}/userProfile/${userId}`),

          axios.get(`${API_URL}/repo/user/${userId}`).catch((err) => {
            if (err.response?.status === 404) {
              return { data: { repositories: [] } };
            }
            throw err;
          }),
        ]);

        setUserDetails(userResponse.data.user || userResponse.data);
        setRepositories(repoResponse.data.repositories || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load profile information.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/auth", { replace: true });
  };

  const filteredRepositories = repositories
    .filter((repo) => {
      const matchesSearch = (repo.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesType =
        repoType === "all" ||
        (repoType === "public" && repo.visibility === true) ||
        (repoType === "private" && repo.visibility === false);

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return (
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
      );
    });

  const username = userDetails.username || "username";

  return (
    <>
      <Navbar />

      <div className="github-profile">
        {/* LEFT SIDEBAR */}
        <aside className="github-profile-sidebar">
          <div className="github-avatar">
            {userDetails.avatar ? (
              <img src={userDetails.avatar} alt="Profile" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          <h1>{username}</h1>

          <p className="github-user-login">
            @{username.toLowerCase().replace(/\s/g, "")}
          </p>

          <p className="github-bio">{userDetails.bio || "No bio available."}</p>

          <button className="github-edit-btn">Edit profile</button>

          <div className="github-followers">
            <PeopleIcon size={16} />
            <strong>10</strong> followers
            <span>·</span>
            <strong>3</strong> following
          </div>

          {userDetails.email && (
            <p className="github-sidebar-detail">✉ {userDetails.email}</p>
          )}

          <button className="github-logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="github-profile-content">
          {/* PROFILE NAVIGATION */}
          <div className="github-profile-tabs">
            <button className="active">
              <BookIcon size={16} />
              Overview
            </button>

            <button onClick={() => navigate("/")}>
              <RepoIcon size={16} />
              Repositories
              <span>{repositories.length}</span>
            </button>

            <button>
              <StarIcon size={16} />
              Stars
            </button>
          </div>

          {/* PINNED REPOSITORIES */}
          <section className="github-pinned-section">
            <div className="github-section-heading">
              <h2>Popular repositories</h2>

              <button onClick={() => navigate("/create")}>
                <PlusIcon size={16} />
                New
              </button>
            </div>

            {loading ? (
              <p>Loading repositories...</p>
            ) : error ? (
              <p className="github-error">{error}</p>
            ) : repositories.length > 0 ? (
              <div className="github-repo-grid">
                {repositories.slice(0, 6).map((repo) => (
                  <div className="github-repo-card" key={repo._id}>
                    <div className="github-repo-name">
                      <RepoIcon size={16} />
                      <a href={`/repo/${repo._id}`}>{repo.name}</a>
                      <span>{repo.visibility ? "Public" : "Private"}</span>
                    </div>

                    <p>{repo.description || "No description provided."}</p>

                    <div className="github-repo-language">
                      <span className="language-dot"></span>
                      Repository
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="github-empty">
                You don't have any repositories yet.
              </p>
            )}
          </section>

          {/* CONTRIBUTION GRAPH */}
          <section className="github-contributions">
            <h2>{repositories.length} repositories</h2>

            <div className="github-heatmap">
              <HeatMapProfile />
            </div>
          </section>

          {/* ALL REPOSITORIES */}
          <section className="github-all-repositories">
            <div className="github-section-heading">
              <h2>Repositories</h2>

              <button onClick={() => navigate("/create")}>
                <PlusIcon size={16} />
                New
              </button>
            </div>

            <div className="github-repo-filters">
              <div className="github-repo-search">
                <SearchIcon size={16} />

                <input
                  type="text"
                  placeholder="Find a repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={repoType}
                onChange={(e) => setRepoType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Name</option>
              </select>
            </div>

            {loading ? (
              <p>Loading repositories...</p>
            ) : filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <div className="github-repository-row" key={repo._id}>
                  <div className="github-repository-info">
                    <div>
                      <RepoIcon size={16} />
                      <a href={`/repo/${repo._id}`}>{repo.name}</a>

                      <span className="github-visibility">
                        {repo.visibility ? "Public" : "Private"}
                      </span>
                    </div>

                    <p>{repo.description || "No description provided."}</p>

                    <small>Updated recently</small>
                  </div>

                  <button className="github-star-btn">
                    <StarIcon size={16} />
                    Star
                  </button>
                </div>
              ))
            ) : (
              <p className="github-empty">No repositories found.</p>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default Profile;
