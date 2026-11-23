import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import API_URL from "../../config";
import { getSocket } from "../../socket";
import "./repositoryDetails.css";

const RepositoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [issues, setIssues] = useState([]);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [error, setError] = useState("");
  const [issueError, setIssueError] = useState("");

  const fetchIssues = useCallback(async () => {
    if (!id) return;
    try {
      setIssuesLoading(true);
      const response = await fetch(API_URL + "/issue/all/" + id, {
        headers: { Authorization: "Bearer " + (localStorage.getItem("token") || "") },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load issues");
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      setIssueError(err.message);
    } finally {
      setIssuesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    const fetchRepository = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(API_URL + "/repo/" + id);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Repository not found");
        if (active) setRepository(data.repository);
      } catch (err) {
        if (active) setError(err.message || "Something went wrong");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRepository();
    fetchIssues();

    let socket;
    let joinRepositoryRoom;
    const refreshOnIssueChange = () => {
      fetchIssues();
      fetchRepository();
    };

    getSocket()
      .then((connectedSocket) => {
        if (!active) return;
        socket = connectedSocket;

        joinRepositoryRoom = () => socket.emit("joinRepository", id);
        socket.on("connect", joinRepositoryRoom);
        if (socket.connected) joinRepositoryRoom();

        socket.on("issue:created", refreshOnIssueChange);
        socket.on("issue:updated", refreshOnIssueChange);
        socket.on("issue:deleted", refreshOnIssueChange);
      })
      .catch((err) => console.error("Realtime issue connection failed:", err.message));

    return () => {
      active = false;
      if (socket) {
        if (joinRepositoryRoom) socket.off("connect", joinRepositoryRoom);
        socket.off("issue:created", refreshOnIssueChange);
        socket.off("issue:updated", refreshOnIssueChange);
        socket.off("issue:deleted", refreshOnIssueChange);
      }
    };
  }, [id, fetchIssues]);

  const handleCreateIssue = async (event) => {
    event.preventDefault();
    setIssueError("");

    if (!issueTitle.trim() || !issueDescription.trim()) {
      setIssueError("Please enter an issue title and description.");
      return;
    }

    try {
      setCreatingIssue(true);
      const response = await fetch(API_URL + "/issue/create/" + id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (localStorage.getItem("token") || ""),
        },
        body: JSON.stringify({
          title: issueTitle.trim(),
          description: issueDescription.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create issue");

      setIssueTitle("");
      setIssueDescription("");
      await fetchIssues();
    } catch (err) {
      setIssueError(err.message);
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleIssueStatus = async (issue) => {
    const nextStatus = issue.status === "closed" ? "open" : "closed";
    try {
      const response = await fetch(API_URL + "/issue/update/" + issue._id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (localStorage.getItem("token") || ""),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update issue");
      await fetchIssues();
    } catch (err) {
      setIssueError(err.message);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      const response = await fetch(API_URL + "/issue/delete/" + issueId, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + (localStorage.getItem("token") || "") },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete issue");
      await fetchIssues();
    } catch (err) {
      setIssueError(err.message);
    }
  };

  const ownerName =
    typeof repository?.owner === "object"
      ? repository.owner?.username || repository.owner?.email
      : "Repository owner";

  if (loading) {
    return <><Navbar /><div className="repo-details-message">Loading repository...</div></>;
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
          <button className="repo-back-button" onClick={() => navigate("/")}>
            ← Back to repositories
          </button>

          <div className="repo-details-heading">
            <div>
              <div className="repo-title-line">
                <span className="repo-icon">📁</span>
                <h1>{repository.name}</h1>
                <span className={"repo-visibility " + (repository.visibility ? "public" : "private")}>
                  {repository.visibility ? "Public" : "Private"}
                </span>
              </div>
              <p className="repo-owner">{ownerName} / <strong>{repository.name}</strong></p>
            </div>
          </div>

          <p className="repo-description">{repository.description || "No description provided."}</p>

          <div className="repo-stats">
            <span>⭐ {repository.stars?.length || 0} stars</span>
            <span>Issues: {issues.length}</span>
            <span>Created: {repository.createdAt ? new Date(repository.createdAt).toLocaleDateString() : "Date unavailable"}</span>
          </div>

          <section className="repo-code-section">
            <div className="repo-code-header">
              <div><span>📁</span><strong>{repository.name}</strong></div>
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
                  <p>Add a README or start adding files to your repository.</p>
                </div>
              )}
            </div>
          </section>

          <section style={{ marginTop: "28px", padding: "20px", border: "1px solid #d0d7de", borderRadius: "8px", background: "#fff" }}>
            <h2>Issues ({issues.length})</h2>
            <form onSubmit={handleCreateIssue} style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
              <input
                value={issueTitle}
                onChange={(event) => setIssueTitle(event.target.value)}
                placeholder="Issue title"
                maxLength={160}
                required
              />
              <textarea
                value={issueDescription}
                onChange={(event) => setIssueDescription(event.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                required
              />
              <button type="submit" disabled={creatingIssue}>
                {creatingIssue ? "Creating..." : "Create issue"}
              </button>
            </form>

            {issueError && <p role="alert">{issueError}</p>}
            {issuesLoading ? (
              <p>Loading issues...</p>
            ) : issues.length === 0 ? (
              <p>No issues yet. Create the first one.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {issues.map((issue) => (
                  <article key={issue._id} style={{ borderTop: "1px solid #d8dee4", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <strong>{issue.title || issue.tittle || "Untitled issue"}</strong>
                      <span>{issue.status || "open"}</span>
                    </div>
                    <p>{issue.description}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button" onClick={() => handleIssueStatus(issue)}>
                        Mark {issue.status === "closed" ? "open" : "closed"}
                      </button>
                      <button type="button" onClick={() => handleDeleteIssue(issue._id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default RepositoryDetails;
