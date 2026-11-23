
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "./createRepository.css";

import {
  RepoIcon,
  LockIcon,
  BookIcon,
  CheckCircleFillIcon,
  ArrowLeftIcon,
} from "@primer/octicons-react";

const CreateRepository = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [initializeReadme, setInitializeReadme] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const owner = localStorage.getItem("userId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!owner) {
      setError("Please login before creating a repository.");
      return;
    }

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Repository name is required.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
      setError(
        "Repository name can only contain letters, numbers, dots, hyphens and underscores."
      );
      return;
    }

    try {
      setLoading(true);

      const initialContent = initializeReadme
        ? `# ${cleanName}\n\n${description.trim() || "Welcome to my repository!"}\n`
        : "";

      const response = await fetch(
        "http://localhost:3000/repo/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
            description: description.trim(),
            visibility,
            owner,
            content: initialContent,
            issues: [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Unable to create repository."
        );
      }

      alert("Repository created successfully!");

      navigate("/");

    } catch (err) {
      console.error("Create repository error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="github-create-page">

        <div className="github-create-header">
          <button
            className="github-back-btn"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeftIcon size={16} />
            Back
          </button>

          <h1>Create a new repository</h1>

          <p>
            A repository contains all project files, including
            revision history. Already have a repository elsewhere?
            You can import a repository.
          </p>
        </div>

        <form
          className="github-create-form"
          onSubmit={handleSubmit}
        >

          {/* OWNER */}
          <div className="github-form-group">
            <label>Owner</label>

            <div className="github-owner-field">
              <div className="github-owner-avatar">
                <RepoIcon size={18} />
              </div>

              <span>{owner || "Unknown user"}</span>

              <span className="github-owner-arrow">/</span>
            </div>
          </div>

          {/* REPOSITORY NAME */}
          <div className="github-form-group">
            <label htmlFor="repo-name">
              Repository name <span>*</span>
            </label>

            <input
              id="repo-name"
              type="text"
              placeholder="my-awesome-project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />

            <small>
              Great repository names are short and memorable.
            </small>
          </div>

          {/* DESCRIPTION */}
          <div className="github-form-group">
            <label htmlFor="repo-description">
              Description
            </label>

            <textarea
              id="repo-description"
              placeholder="Describe your repository..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={350}
              rows={3}
            />

            <small className="github-character-count">
              {description.length}/350 characters
            </small>
          </div>

          <div className="github-form-divider"></div>

          {/* VISIBILITY */}
          <div className="github-form-group">
            <h3>Choose visibility</h3>

            <label className="github-visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === true}
                onChange={() => setVisibility(true)}
              />

              <div className="github-option-icon">
                <RepoIcon size={20} />
              </div>

              <div className="github-option-content">
                <strong>Public</strong>
                <p>
                  Anyone on the internet can see this repository.
                  You choose who can contribute.
                </p>
              </div>
            </label>

            <label className="github-visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === false}
                onChange={() => setVisibility(false)}
              />

              <div className="github-option-icon">
                <LockIcon size={20} />
              </div>

              <div className="github-option-content">
                <strong>Private</strong>
                <p>
                  You choose who can see and contribute to this repository.
                </p>
              </div>
            </label>
          </div>

          <div className="github-form-divider"></div>

          {/* README */}
          <div className="github-form-group">
            <h3>Initialize this repository</h3>

            <label className="github-readme-option">
              <div className="github-readme-info">
                <BookIcon size={20} />

                <div>
                  <strong>Add a README file</strong>
                  <p>
                    A README contains information about your project.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={initializeReadme}
                onChange={(e) =>
                  setInitializeReadme(e.target.checked)
                }
              />
            </label>
          </div>

          {/* ERROR */}
          {error && (
            <div className="github-create-error">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <div className="github-create-footer">
            <div className="github-create-success">
              <CheckCircleFillIcon size={16} />
              Ready to create your repository
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="github-create-submit"
            >
              {loading ? "Creating repository..." : "Create repository"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default CreateRepository;
