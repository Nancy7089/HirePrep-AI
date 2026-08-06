import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import { useSelector } from "react-redux";
import { HiSparkles } from "react-icons/hi";
import {
  BsRobot,
  BsMic,
  BsClock,
  BsFileEarmarkText,
  BsBarChart,
} from "react-icons/bs";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AuthModel from "../../components/AuthModel";

import evalImg from "../../assets/ai-ans.png";
import resumeImg from "../../assets/resume.png";
import pdfImg from "../../assets/pdf.png";
import analyeticsImg from "../../assets/history.png";

import hrImg from "../../assets/HR.png";
import techImg from "../../assets/tech.png";
import confidenceImg from "../../assets/confi.png";
import credit from "../../assets/credit.png";
import Footer from "../../components/Footer";

function Home() {
  const { userData } = useSelector((state) => state.user);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      icon: <BsRobot size={24} />,
      step: "STEP 1",
      title: "Role & Experience Selection",
      desc: "AI adjusts difficulty based on selected job role.",
    },
    {
      icon: <BsMic size={24} />,
      step: "STEP 2",
      title: "Smart Voice Interview",
      desc: "Dynamic follow-up question based on your answers.",
    },
    {
      icon: <BsClock size={24} />,
      step: "STEP 3",
      title: "Timer Based Simulation",
      desc: "Real interview pressure with time tracker.",
    },
  ];

  const features = [
    {
      image: evalImg,
      icon: <BsBarChart size={20} />,
      title: "AI Answer Evaluation",
      desc: "Scores communication, technical accuracy and confidence.",
    },
    {
      image: resumeImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Resume Based Interview",
      desc: "Project-specific questions based on uploaded resume.",
    },
    {
      image: pdfImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Downloadable PDF Report",
      desc: "Detailed strengths, weaknesses and improvement insights.",
    },
    {
      image: analyeticsImg,
      icon: <BsBarChart size={20} />,
      title: "History & Analytics",
      desc: "Track progress with performance graph analysis.",
    },
  ];

  const interviewModes = [
    {
      image: hrImg,
      icon: <BsBarChart size={20} />,
      title: "HR Interview",
      desc: "Practice behavioral and HR-focused questions.",
    },
    {
      image: techImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Technical Interview",
      desc: "Prepare for coding and domain-specific questions.",
    },
    {
      image: confidenceImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Confidence Booster",
      desc: "Improve communication and confidence.",
    },
    {
      image: credit,
      icon: <BsBarChart size={20} />,
      title: "Credit Based System",
      desc: "Track usage and performance credits.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <Navbar />

      <div className="flex-1 px-4 py-10">
        <div className="max-w-6xl mx-auto">

          {/* HERO */}
          <div className="flex flex-col items-center justify-center text-center min-h-[70vh] max-w-4xl mx-auto">
            <p className="text-sm text-gray-500 mb-3 uppercase">
              ✨ Introducing
            </p>

            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-300 blur-3xl opacity-40 rounded-full"></div>

              <div className="relative bg-white/70 backdrop-blur-xl border px-8 py-3 rounded-full flex items-center gap-3 shadow-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <HiSparkles size={16} className="text-green-600" />
                </div>

                <span className="text-gray-700 text-sm md:text-base">
                  AI powered smart Interview Platform
                </span>
              </div>
            </div>

            <motion.h1 className="text-3xl md:text-5xl font-bold text-gray-800">
              Practice interviews with <br className="md:hidden" />
              <span className="block md:inline-block mt-3 md:mt-0 bg-green-100 text-green-600 px-5 py-2 rounded-full text-xl md:text-3xl font-semibold">
                AI Intelligence
              </span>
            </motion.h1>

            <p className="text-gray-500 mt-4 max-w-xl">
              Role-based mock interviews with smart follow-ups and real-time evaluation.
            </p>

            <div className="flex gap-4 mt-8 flex-wrap justify-center">
              <button
                onClick={() => (!userData ? setShowAuth(true) : navigate("/interview"))}
                className="bg-green-600 text-white px-8 py-3 rounded-full"
              >
                Start Interview
              </button>

              <button
                onClick={() => (!userData ? setShowAuth(true) : navigate("/history"))}
                className="bg-white border px-8 py-3 rounded-full"
              >
                View History
              </button>
            </div>
          </div>

          {/* STEPS */}
          <div className="flex flex-col md:flex-row gap-10 mt-10 justify-center items-center">
            {steps.map((item, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="bg-white p-8 rounded-3xl shadow-md w-80 text-center">
                <div className="bg-green-100 p-3 rounded-full inline-block text-green-600">
                  {item.icon}
                </div>
                <p className="text-xs mt-2 text-gray-400">{item.step}</p>
                <h3 className="font-semibold mt-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* FEATURES */}
          <div className="mt-20 mb-20">
            <h2 className="text-4xl text-center mb-12">
              Advanced AI <span className="text-green-600">Capabilities</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className="bg-white p-6 rounded-2xl shadow-md text-center">
                  <img src={item.image} className="h-40 mx-auto mb-4" />
                  <div className="text-green-600 mb-2">{item.icon}</div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* INTERVIEW MODES */}
          <div className="mb-32">
            <h2 className="text-4xl text-center mb-12">
              Multiple Interview <span className="text-green-600">Modes</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {interviewModes.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition"
                >
                  <div className="flex items-center justify-between gap-6">
                    
                    {/* LEFT TEXT */}
                    <div className="flex-1 text-left">
                      <div className="text-green-600 mb-2">{item.icon}</div>

                      <h3 className="font-semibold text-lg mb-2">
                        {item.title}
                      </h3>

                      <p className="text-gray-500 text-sm">
                        {item.desc}
                      </p>
                    </div>

                    {/* RIGHT IMAGE */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    <Footer/>
    </div>
  );
}

export default Home;
