const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId;

dotenv.config();
const uri = process.env.MONGODB_URL;

let client;

async function connectClient() {
  if (!uri) {
    throw new Error(uri);
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();

    console.log("MongoDB connected successfully!");
  }
}

async function signup(req, res) {
  const { username, password, email } = req.body;
  try {
    await connectClient();
    const db = client.db("githubclone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      password: hashedPassword,
      email,
      bio: "",
      avatar: "",
      repositories: [],
      followedUsers: [],
      followingUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    return res.status(201).json({
      message: "User registered successfully!",
      token,
      userId: result.insertedId,
    });
  } catch (err) {
    console.error("Error during signup:", err);

    return res.status(500).json({
      message: "Server error!",
      error: err.message,
    });
  }
}


async function login(req, res) {
  const { email, password } = req.body;

  try {
    await connectClient();

    const db = client.db("githubclone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password!",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("Error during login:", err.message);

    return res.status(500).json({
      message: "Server error!",
    });
  }
}


async function getAllUsers(req, res) {
  try {
    await connectClient();
    const db = client.db("githubclone");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function getUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!ObjectId.isValid(currentID)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await connectClient();

    const usersCollection = client.db("githubclone").collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(currentID) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("githubclone");
    const usersCollection = db.collection("users");

    let updateFields = { email };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      {
        _id: new ObjectId(currentID),
      },
      { $set: updateFields },
      { returnDocument: "after" },
    );
    if (!result.value) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.send(result.value);
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    await connectClient();
    const db = client.db("githubclone");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currentID),
    });

    if (result.deleteCount == 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { username, email, bio, avatar, password } = req.body;

  try {
    if (!ObjectId.isValid(currentID)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await connectClient();

    const usersCollection = client.db("githubclone").collection("users");

    const updateFields = {};

    if (username !== undefined) updateFields.username = username.trim();
    if (email !== undefined) updateFields.email = email.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (avatar !== undefined) updateFields.avatar = avatar.trim();

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    if (email) {
      const existingEmail = await usersCollection.findOne({
        email: email.trim(),
        _id: { $ne: new ObjectId(currentID) },
      });

      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    if (username) {
      const existingUsername = await usersCollection.findOne({
        username: username.trim(),
        _id: { $ne: new ObjectId(currentID) },
      });

      if (existingUsername) {
        return res.status(409).json({ message: "Username already in use" });
      }
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentID) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    const updatedUser = result.value || result;

    if (!updatedUser || !updatedUser._id) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: hiddenPassword, ...safeUser } = updatedUser;

    return res.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function followUser(req, res) {
  const targetID = req.params.id;
  const { followerId } = req.body;

  try {
    if (!ObjectId.isValid(targetID) || !ObjectId.isValid(followerId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (targetID === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    await connectClient();

    const users = client.db("githubclone").collection("users");

    const targetObjectId = new ObjectId(targetID);
    const followerObjectId = new ObjectId(followerId);

    const targetUser = await users.findOne({ _id: targetObjectId });
    const followerUser = await users.findOne({ _id: followerObjectId });

    if (!targetUser || !followerUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await users.updateOne(
      { _id: targetObjectId },
      { $addToSet: { followedUsers: followerObjectId } },
    );

    await users.updateOne(
      { _id: followerObjectId },
      { $addToSet: { followingUsers: targetObjectId } },
    );

    return res.json({ message: "User followed successfully", following: true });
  } catch (err) {
    console.error("Follow user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function unfollowUser(req, res) {
  const targetID = req.params.id;
  const { followerId } = req.body;

  try {
    if (!ObjectId.isValid(targetID) || !ObjectId.isValid(followerId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await connectClient();

    const users = client.db("githubclone").collection("users");

    const targetObjectId = new ObjectId(targetID);
    const followerObjectId = new ObjectId(followerId);

    await users.updateOne(
      { _id: targetObjectId },
      { $pull: { followedUsers: followerObjectId } },
    );

    await users.updateOne(
      { _id: followerObjectId },
      { $pull: { followingUsers: targetObjectId } },
    );

    return res.json({
      message: "User unfollowed successfully",
      following: false,
    });
  } catch (err) {
    console.error("Unfollow user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getFollowStats(req, res) {
  const userID = req.params.id;

  try {
    if (!ObjectId.isValid(userID)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await connectClient();

    const users = client.db("githubclone").collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(userID) },
      { projection: { followedUsers: 1, followingUsers: 1 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followers = user.followedUsers || [];
    const following = user.followingUsers || [];

    return res.json({
      followersCount: followers.length,
      followingCount: following.length,
      followers,
      following,
    });
  } catch (err) {
    console.error("Follow stats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getFollowStats,
  unfollowUser,
  followUser,
  updateUserProfile,
};
