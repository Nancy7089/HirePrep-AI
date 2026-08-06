import React from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { auth, provider } from "../../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/userslice";

const ServerUrl = "https://ai-interview-agent-9.onrender.com";

function Auth({ isModel = false, onClose }) {
  const dispatch = useDispatch();

  const handleGoogleAuth = async () => {
    try {
      const response = await signInWithPopup(auth, provider);

      const user = response.user;
      const name = user.displayName;
      const email = user.email;

      const result = await axios.post(
        ServerUrl + "/api/auth/google",
        { name, email },
        { withCredentials: true }
      );

      dispatch(setUserData(result.data));
      if (onClose) onClose();

    } catch (error) {
      console.log(error);
      dispatch(setUserData(null));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-100 via-white to-slate-200 relative overflow-hidden">

      {/* 🌈 Background Glow */}
      <div className="absolute w-[400px] h-[400px] bg-indigo-200 blur-[120px] opacity-40 -top-32 -left-32 rounded-full"></div>
      <div className="absolute w-[400px] h-[400px] bg-purple-200 blur-[120px] opacity-40 -bottom-32 -right-32 rounded-full"></div>

      {/* 🧊 Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/40"
      >

        {/* 🤖 Logo */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="bg-gradient-to-tr from-black to-gray-800 text-white p-3 rounded-2xl shadow-md">
            <BsRobot size={22} />
          </div>

          <h2 className="text-xl font-semibold tracking-wide text-gray-800">
            InterviewIQ
          </h2>
        </div>

        {/* ✨ Heading (Updated) */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800 mb-3">
            Start your AI interview
          </h1>

          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600">
            <IoSparkles size={14} />
            AI Smart Interview
          </div>
        </div>

        {/* 📝 Description */}
        <p className="text-center text-sm text-gray-500 mb-8 leading-relaxed">
          Practice interviews, track your progress, and improve with
          <span className="font-medium text-gray-700"> AI-powered insights</span>.
        </p>

        {/* 🚀 Google Button */}
        <motion.button
          onClick={handleGoogleAuth}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
        >
          <FcGoogle size={22} />
          Continue with Google
        </motion.button>

        {/* 🔒 Footer */}
        <p className="text-[11px] text-gray-400 text-center mt-6">
          Secure login powered by Google
        </p>

      </motion.div>
    </div>
  );
}

export default Auth;
