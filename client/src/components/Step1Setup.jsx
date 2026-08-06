import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BsRobot } from "react-icons/bs";
import axios from "axios";
import { ServerUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userslice";

function Step1Setup({ onStart }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // FORM STATES
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("");

  // RESUME STATES
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  // UI STATES
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =========================
     AUTO MODE SELECTION
  ========================= */
  useEffect(() => {
    if (
      role.includes("Developer") ||
      role.includes("Analyst")
    ) {
      setMode("Technical");
    }
  }, [role]);

  /* =========================
     HANDLE RESUME UPLOAD
  ========================= */
  const handleResumeUpload = async (file) => {
    if (!file || analyzing) return;

    // File validation
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF or DOC/DOCX files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }

    setResume(file);
    setAnalyzing(true);
    setAnalyzed(false);

    try {
      const formdata = new FormData();
      formdata.append("resume", file);

      const result = await axios.post(
        `${ServerUrl}/api/interview/resume`,
        formdata,
        { withCredentials: true }
      );

      const data = result.data;

      // Autofill form
      setRole(data.role || "");
      setExperience(data.experience || "");
      setSkills(data.skills || []);
      setProjects(data.projects || []);
      setResumeText(data.resumeText || "");

      setAnalyzed(true);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to analyze resume"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* =========================
     START INTERVIEW
  ========================= */
  const handleStart = async () => {
    if (!userData) {
      alert("Please login first");
      return;
    }

    if (!role || !experience || !mode) return;

    setLoading(true);

    try {
      const result = await axios.post(
        `${ServerUrl}/api/interview/generate-question`,
        {
          role,
          experience,
          mode,
          resumeText,
          projects,
          skills,
        },
        { withCredentials: true }
      );

      dispatch(
        setUserData({
          ...userData,
          credits: result.data.creditsLeft,
        })
      );

      onStart(result.data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4"
    >
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border grid md:grid-cols-2 overflow-hidden">

        {/* LEFT */}
        <div className="relative bg-gradient-to-br from-green-100 via-white to-green-50 p-12 flex flex-col justify-center">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-300 rounded-full blur-3xl opacity-30"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-black text-white p-3 rounded-xl shadow-md">
                <BsRobot size={20} />
              </div>
              <h2 className="text-xl font-semibold">
                InterviewIQ
              </h2>
            </div>

            <h1 className="text-3xl font-bold mb-4">
              Start Your AI Interview 🚀
            </h1>

            <p className="text-gray-600">
              Practice real interview scenarios with AI.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-4">
            Setup Interview
          </h2>

          {/* ROLE */}
          <div className="mb-4">
            <label className="text-sm">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border bg-gray-50"
            >
              <option value="">Choose role</option>
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Full Stack Developer</option>
              <option>Data Analyst</option>
            </select>
          </div>

          {/* EXPERIENCE */}
          <div className="mb-4">
            <label className="text-sm">Experience</label>
            <select
              value={experience}
              onChange={(e) =>
                setExperience(e.target.value)
              }
              className="w-full mt-1 p-3 rounded-xl border bg-gray-50"
            >
              <option value="">Select experience</option>
              <option>Fresher</option>
              <option>1-2 Years</option>
              <option>3-5 Years</option>
              <option>5+ Years</option>
            </select>
          </div>

          {/* MODE */}
          <div className="mb-4">
            <label className="text-sm">
              Interview Type
            </label>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setMode("HR")}
                className={`p-3 rounded-xl border ${
                  mode === "HR"
                    ? "bg-green-600 text-white"
                    : "bg-gray-50"
                }`}
              >
                HR
              </button>

              <button
                onClick={() => setMode("Technical")}
                className={`p-3 rounded-xl border ${
                  mode === "Technical"
                    ? "bg-green-600 text-white"
                    : "bg-gray-50"
                }`}
              >
                Technical
              </button>
            </div>
          </div>

          {/* RESUME */}
          <div className="mb-6">
            <label className="text-sm">
              Upload Resume
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleResumeUpload(
                  e.dataTransfer.files[0]
                );
              }}
            >
              <label
                htmlFor="resumeUpload"
                className="block mt-1 border-2 border-dashed rounded-xl p-4 text-center bg-gray-50 cursor-pointer hover:bg-gray-100"
              >
                {resume
                  ? resume.name
                  : "Click or Drag Resume"}
              </label>

              <input
                type="file"
                id="resumeUpload"
                className="hidden"
                onChange={(e) =>
                  handleResumeUpload(
                    e.target.files[0]
                  )
                }
                disabled={analyzing}
              />
            </div>

            {analyzing && (
              <div className="flex gap-2 text-green-600 text-sm mt-2">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                Analyzing resume...
              </div>
            )}

            {analyzed && (
              <p className="text-green-600 text-sm mt-2">
                ✅ Resume analyzed
              </p>
            )}

            {/* SKILLS */}
            {skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs bg-green-100 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* PROJECTS */}
            {projects.length > 0 && (
              <ul className="mt-3 text-sm list-disc ml-5">
                {projects.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>

          {/* START */}
          <button
            onClick={handleStart}
            disabled={
              !role ||
              !experience ||
              !mode ||
              loading ||
              analyzing
            }
            className={`w-full py-3 rounded-xl text-white ${
              loading
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Starting..."
              : "Start Interview"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Step1Setup;