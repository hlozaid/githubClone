const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mainRouter = require("./routes/main.router");
const { setIO } = require("./socket");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "Start a new server", {}, startServer)
  .command("init", "Initialize a new repository", {}, initRepo)
  .command("add <file>", "Add a file to the repository", (y) => {
    y.positional("file", { describe: "File to add", type: "string" });
  }, (argv) => addRepo(argv.file))
  .command("commit <message>", "Commit staged files", (y) => {
    y.positional("message", { describe: "Commit message", type: "string" });
  }, (argv) => commitRepo(argv.message))
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits from S3", {}, pullRepo)
  .command("revert <commitID>", "Revert to a specific commit", (y) => {
    y.positional("commitID", { describe: "Commit ID", type: "string" });
  }, (argv) => revertRepo(argv.commitID))
  .demandCommand(1, "You need at least one command")
  .help().argv;

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const allowedOrigins = [
    "https://main.d3r9pp5tp80rdm.amplifyapp.com",
    "https://main.d2662q1yw4bw2h.amplifyapp.com",
    "http://localhost:5173",
  ];

  app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }));
  app.use(express.json());
  app.use("/", mainRouter);

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token || !process.env.JWT_SECRET_KEY) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.data.userID = decoded.id.toString();
      next();
    } catch (error) {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinRoom", () => {
      socket.join("user:" + socket.data.userID);
      console.log("User notification room joined:", socket.data.userID);
    });

    socket.on("joinRepository", async (repositoryID) => {
      if (typeof repositoryID !== "string" || !mongoose.Types.ObjectId.isValid(repositoryID)) {
        return;
      }

      try {
        const Repository = require("./models/repoModel");
        const repository = await Repository.findById(repositoryID).select("visibility owner");
        if (!repository) return;

        const userID = socket.data.userID;
        const isOwner = userID && repository.owner.toString() === userID;
        if (!repository.visibility && !isOwner) return;

        socket.join("repository:" + repositoryID);
      } catch (error) {
        console.error("Repository room join failed:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL is missing");
    }

    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");

    httpServer.listen(port, "0.0.0.0", () => {
      console.log("Server running on port " + port);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}
