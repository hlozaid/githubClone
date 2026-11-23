
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "./repositoryDetails.css";
import API_URL from "../../config";

const RepositoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/repo/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Repository not found");
        }

        setRepository(data.repository);
      } catch (err) {
        console.error("Repository fetch error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRepository();
  }, [id]);

  const ownerName =
    typeof repository?.owner === "object"
      ? repository.owner?.username || repository.owner?.email
      : "Repository owner";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="repo-details-message">Loading repository...</div>
      </>
    );
  }

  if (error || !repository) {
    return (
      <>
        <Navbar />
        <div className="repo-details-message">
          <h2>Repository not found</h2>
          <p>{error || "This repository does not exist."}</p>
          <button onClick={() => navigate("/")}>Back to Dashboard</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="repo-details-page">
        <div className="repo-details-container">

          <button
            className="repo-back-button"
            onClick={() => navigate("/")}
          >
            ← Back to repositories
          </button>

          <div className="repo-details-heading">
            <div>
              <div className="repo-title-line">
                <span className="repo-icon">📁</span>
                <h1>{repository.name}</h1>

                <span
                  className={`repo-visibility ${
                    repository.visibility ? "public" : "private"
                  }`}
                >
                  {repository.visibility ? "Public" : "Private"}
                </span>
              </div>

              <p className="repo-owner">
                {ownerName} / <strong>{repository.name}</strong>
              </p>
            </div>
          </div>

          <p className="repo-description">
            {repository.description || "No description provided."}
          </p>

          <div className="repo-stats">
            <span>⭐ {repository.stars?.length || 0} stars</span>
            <span> Issues: {repository.issues?.length || 0}</span>
            <span>
              Created:{" "}
              {repository.createdAt
                ? new Date(repository.createdAt).toLocaleDateString()
                : "Date unavailable"}
            </span>
          </div>

          <section className="repo-code-section">
            <div className="repo-code-header">
              <div>
                <span>📁</span>
                <strong>{repository.name}</strong>
              </div>
              <span className="repo-code-label">Repository content</span>
            </div>

            <div className="repo-readme">
              <h2>📖 README</h2>

              {repository.content?.trim() ? (
                <pre>{repository.content}</pre>
              ) : (
                <div className="repo-empty-content">
                  <span>📄</span>
                  <h3>This repository is empty</h3>
                  <p>
                    Add a README or start adding files to your repository.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </>
  );
};

export default RepositoryDetails;
