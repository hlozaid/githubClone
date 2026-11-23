
const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Repository name is required"],
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 350,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    visibility: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    issues: [
      {
        type: Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Same user cannot create duplicate repository names.
// Different users can use the same repository name.
RepositorySchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);

const Repository = mongoose.model("Repository", RepositorySchema);

module.exports = Repository;
