import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsRobot, BsCalendar3, BsTrophy, BsClockHistory, BsBarChartLine, BsArrowRight } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../../App";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const statusColor = {
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Incompleted: "bg-amber-100 text-amber-700 border-amber-200",
};

const scoreColor = (score) => {
  if (score >= 8) return "text-emerald-500";
  if (score >= 5) return "text-amber-500";
  return "text-red-400";
};

const scoreLabel = (score) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Average";
  return "Needs Work";
};

const modeIcon = (mode) => {
  if (mode === "Technical") return "⚙️";
  if (mode === "HR") return "🧑‍💼";
  return "🎯";
};

function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/interview/history`, {
          withCredentials: true,
        });
        setInterviews(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const avgScore =
    interviews.length > 0
      ? (
          interviews.reduce((s, i) => s + (i.finalScore || 0), 0) /
          interviews.length
        ).toFixed(1)
      : 0;

  const completed = interviews.filter((i) => i.status === "Completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <Navbar />

      <div className="flex-1 px-4 py-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-black text-white p-2 rounded-xl">
              <BsClockHistory size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Interview History
            </h1>
          </div>
          <p className="text-gray-500 ml-14">
            Track your progress and review past sessions.
          </p>
        </motion.div>

        {/* Stats Strip */}
        {!loading && interviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-10"
          >
            {[
              {
                icon: <BsBarChartLine size={18} className="text-green-600" />,
                label: "Total Sessions",
                value: interviews.length,
                bg: "bg-green-50 border-green-100",
              },
              {
                icon: <BsTrophy size={18} className="text-amber-500" />,
                label: "Avg Score",
                value: `${avgScore}/10`,
                bg: "bg-amber-50 border-amber-100",
              },
              {
                icon: <BsCalendar3 size={18} className="text-indigo-500" />,
                label: "Completed",
                value: completed,
                bg: "bg-indigo-50 border-indigo-100",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`${stat.bg} border rounded-2xl p-5 flex items-center gap-4`}
              >
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading history...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && interviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-4 text-center"
          >
            <HiOutlineEmojiSad size={52} className="text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600">
              No interviews yet
            </h2>
            <p className="text-gray-400 max-w-xs">
              Start your first AI-powered interview session to see your history
              here.
            </p>
            <button
              onClick={() => navigate("/interview")}
              className="mt-4 bg-green-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-green-700 transition"
            >
              Start Interview
            </button>
          </motion.div>
        )}

        {/* Interview Cards */}
        {!loading && !error && interviews.length > 0 && (
          <div className="grid md:grid-cols-2 gap-5">
            <AnimatePresence>
              {interviews.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition"
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{modeIcon(item.mode)}</span>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {item.role}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-0.5 rounded-full">
                          {item.experience}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-0.5 rounded-full">
                          {item.mode} Round
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-medium ${
                        statusColor[item.status] || statusColor.Incompleted
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-50 rounded-2xl p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Final Score</p>
                      <p
                        className={`text-3xl font-black ${scoreColor(
                          item.finalScore
                        )}`}
                      >
                        {item.finalScore || 0}
                        <span className="text-sm font-normal text-gray-400">
                          /10
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {scoreLabel(item.finalScore)}
                      </p>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-2xl p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Date</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* View Report */}
                  {item.status === "Completed" && (
                    <button
                      onClick={() =>
                        navigate(`/report?id=${item._id}`)
                      }
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm font-medium hover:bg-green-100 transition"
                    >
                      View Report <BsArrowRight size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default InterviewHistory;
