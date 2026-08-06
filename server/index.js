import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/connectDb.js";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interviewRouter.js";

dotenv.config();

const app = express();

// ✅ FIXED CORS
app.use(cors({
  origin: "https://ai-interview-agent-9.onrender.com",
  credentials: true
}));

// ✅ Middleware first
app.use(express.json());
app.use(cookieParser());


connectDb();


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview",interviewRouter)
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
