const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const { MongoClient, ObjectId } = require("mongodb");

const mongoUri = process.env.MONGODB_URL;
let nativeClient;

async function getNativeUsersCollection() {
  if (!nativeClient) {
    if (!mongoUri) {
      throw new Error("MONGODB_URL is missing");
    }

    nativeClient = new MongoClient(mongoUri);
    await nativeClient.connect();
  }

  return nativeClient.db("githubclone").collection("users");
}

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const newRepository = new Repository({
      name: name.trim(),
      description,
      visibility,
      owner,
      content,
      issues,
    });
    const existingRepository = await Repository.findOne({
      owner,
      name: name.trim(),
    });

    if (existingRepository) {
      return res.status(409).json({
        message: "You already have a repository with this name!",
      });
    }
    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res.json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid repository ID",
      });
    }

    const repository = await Repository.findById(id)
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        message: "Repository not found",
      });
    }

    return res.status(200).json({
      message: "Repository fetched successfully",
      repository,
    });
  } catch (err) {
    console.error("Fetch repository error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        message: "Invalid User ID",
      });
    }

    const repositories = await Repository.find({
      owner: userID,
    }).populate("owner", "username email");

    return res.status(200).json({
      message: "Repositories fetched successfully",
      repositories,
    });
  } catch (err) {
    console.error("Fetching user repositories error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.content.push(content);
    repository.description = description;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;
  try {
    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleStarRepository(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const users = await getNativeUsersCollection();
    const userObjectId = new ObjectId(userId);

    const user = await users.findOne({ _id: userObjectId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyStarred = (user.starRepos || []).some(
      (repoId) => repoId.toString() === id,
    );

    if (alreadyStarred) {
      await users.updateOne(
        { _id: userObjectId },
        { $pull: { starRepos: new mongoose.Types.ObjectId(id) } },
      );

      return res.json({
        message: "Repository unstarred",
        starred: false,
      });
    }

    await users.updateOne(
      { _id: userObjectId },
      { $addToSet: { starRepos: new mongoose.Types.ObjectId(id) } },
    );

    return res.json({
      message: "Repository starred",
      starred: true,
    });
  } catch (err) {
    console.error("Star repository error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getStarredRepositories(req, res) {
  const { userId } = req.params;

  try {
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const users = await getNativeUsersCollection();

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { starRepos: 1 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ids = (user.starRepos || []).map(
      (id) => new mongoose.Types.ObjectId(id.toString()),
    );

    const repositories = await Repository.find({
      _id: { $in: ids },
    }).populate("owner", "username email");

    return res.json({ repositories });
  } catch (err) {
    console.error("Get starred repositories error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  toggleStarRepository,
  getStarredRepositories,
};
