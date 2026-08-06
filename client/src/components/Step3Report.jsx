import React from "react";
import { motion } from "framer-motion";
import {
  BsRobot,
  BsTrophy,
  BsCheckCircle,
  BsXCircle,
  BsBarChartLine,
  BsMic,
  BsCpu,
  BsBullseye,
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

/* ── Score helpers ── */
const scoreColor = (s) => {
  if (s >= 8) return "text-emerald-500";
  if (s >= 5) return "text-amber-500";
  return "text-red-400";
};

const scoreBg = (s) => {
  if (s >= 8) return "bg-emerald-50 border-emerald-200";
  if (s >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

const label = (s) => {
  if (s >= 8) return "Excellent";
  if (s >= 6) return "Good";
  if (s >= 4) return "Average";
  return "Needs Improvement";
};

const difficultyStyle = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

/* ── Circular Progress ── */
function CircleScore({ value, max = 10, size = 96, label: lbl }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  const color =
    value >= 8 ? "#10b981" : value >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="42" cy="42" r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="42" y="47" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>
          {value}
        </text>
      </svg>
      {lbl && <p className="text-xs text-gray-400 font-medium">{lbl}</p>}
    </div>
  );
}

/* ── Bar ── */
function ScoreBar({ value, max = 10 }) {
  const pct = Math.min((value / max) * 100, 100);
  const bg =
    value >= 8 ? "bg-emerald-500" : value >= 5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className={`h-2.5 rounded-full ${bg}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Main Component ── */
function Step3Report({ report }) {
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No report data found.</p>
          <button
            onClick={() => navigate("/interview")}
            className="bg-green-600 text-white px-6 py-3 rounded-full"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  const {
    averageScore = 0,
    totalScore = 0,
    totalQuestions = 5,
    result = "",
    questions = [],
  } = report;

  // Compute averages from questions if available
  const avgConf =
    questions.length > 0
      ? +(
          questions.reduce((s, q) => s + (q.confidence || 0), 0) /
          questions.length
        ).toFixed(1)
      : 0;
  const avgComm =
    questions.length > 0
      ? +(
          questions.reduce((s, q) => s + (q.communication || 0), 0) /
          questions.length
        ).toFixed(1)
      : 0;
  const avgCorr =
    questions.length > 0
      ? +(
          questions.reduce((s, q) => s + (q.correctness || 0), 0) /
          questions.length
        ).toFixed(1)
      : 0;

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("InterviewIQ — Interview Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Overall Score: ${averageScore}/10  (${result})`, 14, 34);
    doc.text(`Total Score: ${totalScore}  |  Questions: ${totalQuestions}`, 14, 44);
    doc.text(`Confidence: ${avgConf}/10  |  Communication: ${avgComm}/10  |  Correctness: ${avgCorr}/10`, 14, 54);
    doc.line(14, 60, 196, 60);

    let y = 70;
    questions.forEach((q, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Q${i + 1}: ${q.question?.substring(0, 90) || ""}`, 14, y, { maxWidth: 180 });
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Score: ${q.score || 0}/10  |  Difficulty: ${q.difficulty || "-"}`, 14, y);
      y += 7;
      doc.text(`Feedback: ${q.feedback || "-"}`, 14, y, { maxWidth: 180 });
      y += 12;
    });

    doc.save("InterviewIQ_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10 flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-xl">
              <BsRobot size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Interview Report</h1>
              <p className="text-sm text-gray-400">AI-powered performance analysis</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium shadow-sm hover:shadow transition"
            >
              📄 Download PDF
            </button>
            <button
              onClick={() => navigate("/interview")}
              className="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition"
            >
              New Interview
            </button>
          </div>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`border rounded-3xl p-8 mb-6 flex flex-col md:flex-row items-center gap-8 ${scoreBg(averageScore)}`}
        >
          <CircleScore value={averageScore} size={110} />

          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Overall Result</p>
            <h2 className="text-4xl font-black text-gray-800 mb-1">{result || label(averageScore)}</h2>
            <p className="text-gray-500 text-sm">
              Scored <span className="font-semibold text-gray-700">{totalScore}</span> total points across{" "}
              <span className="font-semibold text-gray-700">{totalQuestions}</span> questions.
            </p>
          </div>

          <div className="flex gap-6 md:gap-8">
            {[
              { icon: <BsMic size={18} />, label: "Confidence", value: avgConf },
              { icon: <BsBarChartLine size={18} />, label: "Communication", value: avgComm },
              { icon: <BsCpu size={18} />, label: "Correctness", value: avgCorr },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="text-green-600 flex justify-center mb-1">{m.icon}</div>
                <p className={`text-2xl font-bold ${scoreColor(m.value)}`}>{m.value}</p>
                <p className="text-xs text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Metrics Bars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 mb-6 shadow-sm"
        >
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <BsBullseye className="text-green-600" /> Skill Breakdown
          </h3>
          <div className="flex flex-col gap-5">
            {[
              { label: "Confidence", value: avgConf },
              { label: "Communication", value: avgComm },
              { label: "Correctness / Technical", value: avgCorr },
              { label: "Overall Score", value: averageScore },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">{m.label}</span>
                  <span className={`font-bold ${scoreColor(m.value)}`}>{m.value}/10</span>
                </div>
                <ScoreBar value={m.value} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Question-wise Breakdown */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <BsBarChartLine className="text-green-600" /> Question-wise Analysis
            </h3>

            <div className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          difficultyStyle[q.difficulty] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className={`text-sm font-black ${scoreColor(q.score || 0)}`}
                      >
                        {q.score || 0}/10
                      </span>
                    </div>
                  </div>

                  {/* Answer */}
                  {q.answer && (
                    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3 text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-400 mr-1">Your answer:</span>
                      {q.answer.length > 200 ? q.answer.slice(0, 200) + "…" : q.answer}
                    </div>
                  )}

                  {/* Feedback */}
                  <div
                    className={`flex items-start gap-2 text-xs px-3 py-2 rounded-xl ${
                      (q.score || 0) >= 5
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {(q.score || 0) >= 5 ? (
                      <BsCheckCircle className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <BsXCircle className="mt-0.5 flex-shrink-0" />
                    )}
                    <span>{q.feedback || "No feedback available."}</span>
                  </div>

                  {/* Mini bars */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {[
                      { label: "Confidence", value: q.confidence || 0 },
                      { label: "Communication", value: q.communication || 0 },
                      { label: "Correctness", value: q.correctness || 0 },
                    ].map((m, j) => (
                      <div key={j}>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{m.label}</span>
                          <span>{m.value}/10</span>
                        </div>
                        <ScoreBar value={m.value} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm mb-4">
            Keep practising to improve your score!
          </p>
          <button
            onClick={() => navigate("/interview")}
            className="bg-green-600 text-white px-10 py-3 rounded-full font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            Practice Again 🚀
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Step3Report;
