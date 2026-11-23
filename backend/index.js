
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router");

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
  .command(
    "add <file>",
    "Add a file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add",
        type: "string",
      });
    },
    (argv) => addRepo(argv.file)
  )
  .command(
    "commit <message>",
    "Commit staged files",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv) => commitRepo(argv.message)
  )
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits from S3", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Commit ID",
        type: "string",
      });
    },
    (argv) => revertRepo(argv.commitID)
  )
  .demandCommand(1, "You need at least one command")
  .help().argv;

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  const allowedOrigins = [
    "https://main.d2662q1yw4bw2h.amplifyapp.com",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

  app.use(bodyParser.json());
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

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinRoom", (userID) => {
      if (!userID || typeof userID !== "string") {
        console.log("Invalid user ID");
        return;
      }

      socket.join(userID);
      console.log(`User ${userID} joined room`);
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
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}
