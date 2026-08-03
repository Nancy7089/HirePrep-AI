import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.MONGODB_URL);

try {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected!");
} catch (err) {
  console.error(err);
}