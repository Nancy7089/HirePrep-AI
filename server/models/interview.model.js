import mongoose from "mongoose";

/* =========================
   QUESTION SCHEMA
========================= */
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },

  timeLimit: {
    type: Number,
    default: 60,
  },

  answer: {
    type: String,
    default: "",
  },

  feedback: {
    type: String,
    default: "",
  },

  score: {
    type: Number,
    default: 0,
  },

  confidence: {
    type: Number,
    default: 0,
  },

  communication: {
    type: Number,
    default: 0,
  },

  correctness: {
    type: Number,
    default: 0,
  },
});

/* =========================
   INTERVIEW SCHEMA
========================= */
const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    mode: {
      type: String,
      enum: ["HR", "Technical"],
      required: true,
    },

    resumeText: {
      type: String,
      default: "",
    },

    // IMPORTANT: must match your controller
    questions: [questionSchema],

    finalScore: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Incompleted", "Completed"],
      default: "Incompleted",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   MODEL EXPORT
========================= */
const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;