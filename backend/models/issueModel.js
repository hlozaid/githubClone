const mongoose = require("mongoose");
const { Schema } = mongoose;

const IssueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Keep the old field readable while older issue documents are migrated.
    tittle: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
  },
  { timestamps: true }
);

IssueSchema.pre("validate", function (next) {
  if (!this.title && this.tittle) this.title = this.tittle;
  next();
});

const Issue = mongoose.model("Issue", IssueSchema);
module.exports = Issue;
