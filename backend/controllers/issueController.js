const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");
const { getIO } = require("../socket");

function emitIssueEvent(repository, eventName, issue, action) {
  const io = getIO();
  if (!io) return;

  const repositoryID = repository._id.toString();
  const payload = {
    action,
    repositoryId: repositoryID,
    issue,
    message: "Issue " + action + ": " + (issue.title || issue.tittle || "Untitled"),
    createdAt: new Date().toISOString(),
  };

  io.to("repository:" + repositoryID).emit(eventName, payload);

  const ownerID = repository.owner && repository.owner.toString
    ? repository.owner.toString()
    : repository.owner;

  if (ownerID) {
    io.to("user:" + ownerID).emit("notification", payload);
  }
}

async function createIssue(req, res) {
  const repositoryID = req.params.id || req.body.repository;
  const { title, description } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(repositoryID)) {
      return res.status(400).json({ message: "A valid repository ID is required." });
    }
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const repository = await Repository.findById(repositoryID);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found." });
    }

    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      repository: repository._id,
    });

    repository.issues.push(issue._id);
    await repository.save();

    emitIssueEvent(repository, "issue:created", issue, "created");
    return res.status(201).json({ message: "Issue created successfully.", issue });
  } catch (error) {
    console.error("Issue creation error:", error);
    return res.status(500).json({ message: "Server error while creating issue." });
  }
}

async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) issue.description = description.trim();
    if (status !== undefined) {
      if (!["open", "closed"].includes(status)) {
        return res.status(400).json({ message: "Status must be open or closed." });
      }
      issue.status = status;
    }

    await issue.save();
    const repository = await Repository.findById(issue.repository);
    if (repository) emitIssueEvent(repository, "issue:updated", issue, "updated");

    return res.status(200).json({ message: "Issue updated successfully.", issue });
  } catch (error) {
    console.error("Issue update error:", error);
    return res.status(500).json({ message: "Server error while updating issue." });
  }
}

async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    const repository = await Repository.findById(issue.repository);
    await Issue.findByIdAndDelete(id);

    if (repository) {
      repository.issues = repository.issues.filter(
        (issueID) => issueID.toString() !== id
      );
      await repository.save();
      emitIssueEvent(repository, "issue:deleted", issue, "deleted");
    }

    return res.status(200).json({ message: "Issue deleted successfully." });
  } catch (error) {
    console.error("Issue deletion error:", error);
    return res.status(500).json({ message: "Server error while deleting issue." });
  }
}

async function getAllIssues(req, res) {
  const repositoryID = req.params.id || req.query.repository;

  try {
    if (!mongoose.Types.ObjectId.isValid(repositoryID)) {
      return res.status(400).json({ message: "A valid repository ID is required." });
    }

    const issues = await Issue.find({ repository: repositoryID }).sort({ createdAt: -1 });
    return res.status(200).json(issues);
  } catch (error) {
    console.error("Issue fetching error:", error);
    return res.status(500).json({ message: "Server error while fetching issues." });
  }
}

async function getIssueById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid issue ID." });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    return res.status(200).json(issue);
  } catch (error) {
    console.error("Issue fetch error:", error);
    return res.status(500).json({ message: "Server error while fetching issue." });
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
