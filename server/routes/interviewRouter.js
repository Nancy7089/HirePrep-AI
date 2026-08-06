import express from "express";
import {
  analyzeResume,
  generateQuestion,
  submitAnswer,
  finishInterview,
  getMyInterview,
  getInterviewReport,
} from "../controllers/interview.controllers.js";

import { upload } from "../middlewares/multer.js";
import { isAuth } from "../middlewares/isAuth.js";

const interviewRouter = express.Router();

/* =========================
   ROUTES
========================= */

// Resume Upload
interviewRouter.post(
  "/resume",
  isAuth,
  upload.single("resume"),
  analyzeResume
);

// Generate Questions
interviewRouter.post(
  "/generate-question",
  isAuth,
  generateQuestion
);

// Submit Answer
interviewRouter.post(
  "/submit-answer",
  isAuth,
  submitAnswer
);

// Finish Interview
interviewRouter.post(
  "/finish",
  isAuth,
  finishInterview
);

// GET all interviews for logged-in user (History page)
interviewRouter.get(
  "/history",
  isAuth,
  getMyInterview
);

// GET specific interview report by ID
interviewRouter.get(
  "/report/:id",
  isAuth,
  getInterviewReport
);

export default interviewRouter;
