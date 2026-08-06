import  { useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {ServerUrl} from '../App';
import { setUserData } from "../redux/userslice";
import AuthModel from "../components/AuthModel";
import axios from "axios"
function Navbar() {
  const { userData } = useSelector((state) => state.user);

  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);

  const navigate = useNavigate();
  const dispatch =useDispatch()
  const [showAuth ,setShowAuth] = useState(false);
  const handleLogout = async () => {
  try {
    await axios.get(ServerUrl + "/api/auth/logout", {
      withCredentials: true
    })
    dispatch(setUserData(null));
   setShowCreditPopup(false)
   setShowUserPopup(false)
    setShowAuth(true);
   navigate("/")

  } catch (error) {
    console.log(error);
  }
};
  return (
    <div className="bg-[#f5f6fa] flex justify-center px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-6xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 px-8 py-4 flex justify-between items-center"
      >

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="bg-black text-white p-2 rounded-lg group-hover:rotate-12 transition">
            <BsRobot size={20} />
          </div>

          <h1 className="font-semibold text-lg tracking-wide">
            InterviewIQ
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">

          {/* Credits */}
          <div className="relative">
            <button onClick={() => {
                if(!userData){
                  setShowAuth(true)
                  return
                }
                
                setShowCreditPopup(!showCreditPopup);
                setShowUserPopup(false)

              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition shadow-sm"
            >
              <BsCoin className="text-yellow-500" size={18} />

              <span className="font-semibold">
                {userData?.credits || 0}
              </span>
            </button>

            <AnimatePresence>
              {showCreditPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-xl p-5 z-50"
                >
                  <p className="text-sm text-gray-600 mb-4">
                    Need more credits to continue interview?
                  </p>

                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-900 transition"
                  >
                    Buy more credits
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="relative">

            <button
              onClick={() => {
                if(!userData){
                  setShowAuth(true)
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditPopup(false);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-md hover:scale-105 transition"
            >
              {userData?.name
                ? userData.name.slice(0, 1).toUpperCase()
                : <FaUserAstronaut size={16} />}
            </button>

            <AnimatePresence>
              {showUserPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-56 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50"
                >

                  <p className="text-md text-indigo-600 font-semibold mb-2">
                    {userData?.name}
                  </p>

                  <button
                    onClick={() => navigate("/history")}
                    className="w-full text-left text-sm py-2 hover:text-black text-gray-600 transition"
                  >
                    Interview History
                  </button>

                  <div className="border-t my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition"
                  >
                    <HiOutlineLogout size={18} />
                    Logout
                  </button>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </motion.div>

    {showAuth && <AuthModel onClose={()=>setShowAuth(false)}/>}

    </div>
  );
}

export default Navbar;