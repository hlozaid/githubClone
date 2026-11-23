require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.AWS_REGION || "ap-southeast-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const S3_BUCKET = "hlogit";

module.exports = { s3, S3_BUCKET };