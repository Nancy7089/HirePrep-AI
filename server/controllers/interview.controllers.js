import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/usermodel.js";
import Interview from "../models/interview.model.js";

/* =========================
   HELPER: SAFE JSON PARSE
========================= */
const safeJsonParse = (text, fallback = {}) => {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
};

/* =========================
   ANALYZE RESUME
========================= */
export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const filepath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filepath);
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(fileBuffer),
    }).promise;

    let resumeText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      resumeText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from the resume.

Return strictly valid JSON with no markdown:
{
  "role": "string",
  "experience": "string",
  "projects": ["project1"],
  "skills": ["skill1"]
}
        `,
      },
      { role: "user", content: resumeText },
    ];

    const aiResponse = await askAi(messages);

    const parsed = safeJsonParse(aiResponse, {
      role: "Unknown",
      experience: "Unknown",
      projects: [],
      skills: [],
    });

    await fs.promises.unlink(filepath);

    return res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects || [],
      skills: parsed.skills || [],
      resumeText,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Resume analysis failed",
      error: error.message,
    });
  }
};

/* =========================
   GENERATE QUESTIONS
========================= */
export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience and Mode are required.",
      });
    }

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.credits < 50) {
      return res.status(400).json({
        message: "Minimum 50 credits required",
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length
        ? projects.join(", ")
        : "None";

    const skillsText =
      Array.isArray(skills) && skills.length
        ? skills.join(", ")
        : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
Role: ${role}
Experience: ${experience}
Mode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
    `;

    const messages = [
      {
        role: "system",
        content: `
You are a real interviewer.

Generate exactly 5 interview questions.

Rules:
- 15–25 words each
- One sentence only
- No numbering
- One per line
- Difficulty order: easy, easy, medium, medium, hard
        `,
      },
      { role: "user", content: userPrompt },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse?.trim()) {
      return res.status(500).json({
        message: "AI returned empty response",
      });
    }

    const questionsArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (questionsArray.length < 5) {
      return res.status(500).json({
        message: "AI did not generate enough questions",
      });
    }

    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, i) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][i],
        timeLimit: [60, 60, 90, 90, 120][i],
        score: 0,
      })),
    });

    return res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate interview",
      error: error.message,
    });
  }
};

/* =========================
   SUBMIT ANSWER
========================= */
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timetaken } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const question = interview.questions[questionIndex];

    if (!question) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    if (!answer?.trim()) {
      question.score = 0;
      question.feedback = "No answer submitted";
      question.answer = "";
      await interview.save();
      return res.json({ feedback: question.feedback });
    }

    if (timetaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded";
      question.answer = answer;
      await interview.save();
      return res.json({ feedback: question.feedback });
    }

    const messages = [
      {
        role: "system",
        content: `
Evaluate this interview answer and return strictly valid JSON with no markdown:

{
  "confidence": number (0-10),
  "communication": number (0-10),
  "correctness": number (0-10),
  "finalScore": number (0-10),
  "feedback": "10-15 words summarising performance"
}
        `,
      },
      {
        role: "user",
        content: `Question: ${question.question}\nAnswer: ${answer}`,
      },
    ];

    const aiResponse = await askAi(messages);

    const parsed = safeJsonParse(aiResponse, {
      confidence: 0,
      communication: 0,
      correctness: 0,
      finalScore: 0,
      feedback: "Evaluation failed",
    });

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;

    await interview.save();

    return res.json({ feedback: parsed.feedback });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit answer",
      error: error.message,
    });
  }
};

/* =========================
   FINISH INTERVIEW
========================= */
export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    if (totalQuestions === 0) {
      return res.status(400).json({ message: "No questions found" });
    }

    const totalScore = interview.questions.reduce(
      (sum, q) => sum + (q.score || 0),
      0
    );

    const averageScore = Math.round(totalScore / totalQuestions);

    let result = "Needs Improvement";
    if (averageScore >= 8) result = "Excellent";
    else if (averageScore >= 6) result = "Good";
    else if (averageScore >= 4) result = "Average";

    interview.finalScore = averageScore;
    interview.status = "Completed";
    await interview.save();

    return res.json({
      totalQuestions,
      totalScore,
      averageScore,
      result,
      questions: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to finish interview",
      error: error.message,
    });
  }
};

/* =========================
   GET MY INTERVIEWS (HISTORY)
   FIX: was findOne (returns 1 doc) — use find() + sort + select
========================= */
export const getMyInterview = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    return res.status(500).json({
      message: `Failed to find current user interviews: ${error.message}`,
    });
  }
};

/* =========================
   GET INTERVIEW REPORT
   FIX: was Interview.find(req.params.id) — use findById
========================= */
export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    if (totalQuestions === 0) {
      return res.status(400).json({ message: "No questions found" });
    }

    const totalScore = interview.questions.reduce(
      (sum, q) => sum + (q.score || 0),
      0
    );

    const averageScore = Math.round(totalScore / totalQuestions);

    const avgConfidence =
      interview.questions.reduce((sum, q) => sum + (q.confidence || 0), 0) /
      totalQuestions;
    const avgCommunication =
      interview.questions.reduce((sum, q) => sum + (q.communication || 0), 0) /
      totalQuestions;
    const avgCorrectness =
      interview.questions.reduce((sum, q) => sum + (q.correctness || 0), 0) /
      totalQuestions;

    let result = "Needs Improvement";
    if (averageScore >= 8) result = "Excellent";
    else if (averageScore >= 6) result = "Good";
    else if (averageScore >= 4) result = "Average";

    return res.json({
      finalScore: interview.finalScore,
      averageScore,
      totalScore,
      totalQuestions,
      result,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
      // Alias so Step3Report works with both key names
      questions: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get interview report",
      error: error.message,
    });
  }
};
