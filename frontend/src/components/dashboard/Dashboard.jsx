import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("User not logged in. Please login again.");
      setLoading(false);
      return;
    }

    const fetchRepositories = async () => {
      try {
        const response = await fetch(`${API_URL}/repo/user/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch your repositories");
        }

        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (err) {
        console.error("User repositories error:", err);
        setError(err.message);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/repo/all`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggested repositories");
        }

        const data = await response.json();
        setSuggestedRepositories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Suggested repositories error:", err);
      }
    };

    const fetchData = async () => {
      setLoading(true);

      await Promise.all([fetchRepositories(), fetchSuggestedRepositories()]);

      setLoading(false);
    };

    fetchData();
  }, []);

  const searchResults = repositories.filter((repo) =>
    (repo.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleViewRepository = (repositoryId) => {
    navigate(`/repo/${repositoryId}`);
  };

  return (
    <>
      <Navbar />

      <section id="dashboard">
        {/* Suggested Repositories */}
        <aside>
          <h3>Suggested Repositories</h3>

          {suggestedRepositories.length > 0 ? (
            suggestedRepositories.map((repo) => (
              <div className="repo-card" key={repo._id}>
                <h4>{repo.name}</h4>

                <p>{repo.description || "No description"}</p>

                <button
                  className="view-repo-btn"
                  onClick={() => handleViewRepository(repo._id)}
                >
                  View Repository
                </button>
              </div>
            ))
          ) : (
            <p>No suggested repositories found.</p>
          )}
        </aside>

        {/* Your Repositories */}
        <main>
          <h2>Your Repositories</h2>

          <div id="search">
            <input
              type="text"
              value={searchQuery}
              placeholder="Search repositories..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading repositories...</p>
          ) : error ? (
            <p>{error}</p>
          ) : searchResults.length > 0 ? (
            searchResults.map((repo) => (
              <div className="repo-card" key={repo._id}>
                <h4>{repo.name}</h4>

                <p>{repo.description || "No description"}</p>

                <button
                  className="view-repo-btn"
                  onClick={() => handleViewRepository(repo._id)}
                >
                  View Repository
                </button>
              </div>
            ))
          ) : (
            <p>
              {searchQuery
                ? "No matching repositories found."
                : "You haven't created any repositories yet."}
            </p>
          )}
        </main>

        {/* Upcoming Events */}
        <aside>
          <h3>Upcoming Events</h3>

          <ul>
            <li>Tech Conference - Dec 15</li>
            <li>Developer Meetup - Dec 25</li>
            <li>React Summit - Jan 5</li>
          </ul>
        </aside>
      </section>
    </>
  );
};

export default Dashboard;
