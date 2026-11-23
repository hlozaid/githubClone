# GitHub Clone 🚀

🚀 **Live Demo:** [GitHub Clone – Live Website](https://main.d2662q1yw4bw2h.amplifyapp.com/)
A full-stack GitHub-inspired web application built using React.js, Node.js, Express.js, and MongoDB. This project allows developers to create and manage repositories, explore projects, interact with other developers, and manage their profiles.

## 🌟 Features

### 🔐 Authentication

- User Registration and Login
- JWT-based Authentication
- Password Hashing using bcrypt
- User Session Management

### 📁 Repository Management

- Create New Repositories
- Public and Private Repository Visibility
- View Repository Details
- Search Repositories
- Update Repository Information
- Delete Repositories
- Initialize Repository with README

### 👥 User Management

- User Profiles
- Update Profile Information
- Follow and Unfollow Developers
- Followers and Following Statistics

### ⭐ Repository Interaction

- Star and Unstar Repositories
- View Starred Repositories
- Explore Suggested Repositories

### 🛠️ Custom Repository CLI

- Initialize a Local Repository
- Add Files to Staging Area
- Commit Files with Messages
- Push Commits to AWS S3
- Pull Commits from AWS S3
- Revert to a Previous Commit

---

## 💻 Tech Stack

### Frontend

- React.js
- JavaScript
- CSS3
- React Router DOM
- Primer React
- Axios
- Vite
- React Heat Map

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- MongoDB Native Driver
- JSON Web Token (JWT)
- bcrypt.js
- AWS SDK
- Socket.IO
- Yargs

### Tools

- Visual Studio Code
- Git
- GitHub
- MongoDB Atlas
- AWS S3

---

## 📂 Project Structure

```text
githubClone/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── repo/
│   │   │   └── user/
│   │   ├── authContext.jsx
│   │   ├── App.jsx
│   │   ├── Routes.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── init.js
│   │   ├── add.js
│   │   ├── commit.js
│   │   ├── push.js
│   │   ├── pull.js
│   │   ├── revert.js
│   │   ├── repoController.js
│   │   ├── userController.js
│   │   └── issueController.js
│   │
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── index.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hlozaid/githubClone.git
```

```bash
cd githubClone
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-2
S3_BUCKET=your_bucket_name
```

**Environment Variables:**

| Variable              | Purpose                                       |
| --------------------- | --------------------------------------------- |
| PORT                  | Backend server port                           |
| MONGODB_URL           | MongoDB connection URL                        |
| JWT_SECRET_KEY        | JWT signing secret                            |
| AWS_ACCESS_KEY_ID     | AWS access key                                |
| AWS_SECRET_ACCESS_KEY | AWS secret key                                |
| AWS_REGION            | AWS region                                    |
| S3_BUCKET             | Bucket name used by repository initialization |

AWS credentials are needed for the custom S3 push/pull functionality.

### 3. Start Backend Server

Run the backend server from the backend directory:

```bash
node index.js start
```

Backend server:

```text
http://localhost:3000
```

### 4. Frontend Setup

Open another terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend will run at the Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

---

## 🧑‍💻 Custom Repository CLI Commands

The backend includes a custom Git-inspired repository management CLI built using Node.js and Yargs.

Run these commands from the `backend` directory.

### 1. Initialize a Repository

Creates a local `.hloGit` directory with commits storage and configuration.

```bash
node index.js init
```

### 2. Add a File

Adds a file to the staging area.

```bash
node index.js add filename.txt
```

Example:

```bash
node index.js add README.md
```

### 3. Commit Files

Creates a commit with a message.

```bash
node index.js commit "Initial commit"
```

Example:

```bash
node index.js commit "Added project files"
```

### 4. Push Commits

Uploads local commits to AWS S3.

```bash
node index.js push
```

### 5. Pull Commits

Downloads commits from AWS S3.

```bash
node index.js pull
```

### 6. Revert to a Previous Commit

Restores files from a specified commit ID.

```bash
node index.js revert <commitID>
```

Example:

```bash
node index.js revert 12345678-xxxx-xxxx-xxxx-123456789abc
```

**Note:** The custom CLI's `push` and `pull` commands use AWS S3. They are separate from GitHub's `git push` and `git pull` commands.

---

## 🔗 Backend API Endpoints

Base URL:

```text
http://localhost:3000
```

### User Routes

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| POST   | `/signup`            | Register a new user     |
| POST   | `/login`             | Login user              |
| GET    | `/allUsers`          | Get all users           |
| GET    | `/userProfile/:id`   | Get user profile        |
| PUT    | `/updateProfile/:id` | Update user profile     |
| DELETE | `/deleteProfile/:id` | Delete user profile     |
| POST   | `/follow/:id`        | Follow a user           |
| DELETE | `/unfollow/:id`      | Unfollow a user         |
| GET    | `/followStats/:id`   | Get follower statistics |

### Repository Routes

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| POST   | `/repo/create`          | Create a repository          |
| GET    | `/repo/all`             | Get all repositories         |
| GET    | `/repo/:id`             | Get repository by ID         |
| GET    | `/repo/name/:name`      | Find repository by name      |
| GET    | `/repo/user/:userID`    | Get user's repositories      |
| PUT    | `/repo/update/:id`      | Update repository            |
| DELETE | `/repo/delete/:id`      | Delete repository            |
| PATCH  | `/repo/toggle/:id`      | Toggle repository visibility |
| POST   | `/repo/star/:id`        | Star or unstar repository    |
| GET    | `/repo/starred/:userId` | Get starred repositories     |

### Issue Routes

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| POST   | `/issue/create`     | Create an issue |
| PUT    | `/issue/update/:id` | Update an issue |
| DELETE | `/issue/delete/:id` | Delete an issue |
| GET    | `/issue/all`        | Get all issues  |
| GET    | `/issue/:id`        | Get issue by ID |

---

## 🗄️ Database

MongoDB is used to store application data.

Main collections and models include:

- Users
- Repositories
- Issues

Mongoose handles repository and issue models, while the MongoDB Native Driver is also used for user-related operations.

---

## 🎯 Project Objective

The main objective of this project is to gain practical experience in full-stack web development by building a GitHub-inspired platform.

It demonstrates frontend development, REST API integration, authentication, database operations, repository management, and custom version-control-inspired CLI functionality.

---

## 👨‍💻 Author

**Mohd Zaid**

- GitHub: [@hlozaid](https://github.com/hlozaid)
- Project: [GitHub Clone](https://github.com/hlozaid/githubClone)

---

⭐ If you like this project, consider giving it a star!
