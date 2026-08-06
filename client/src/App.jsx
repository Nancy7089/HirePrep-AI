import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./utils/pages/Home";
import Auth from "./utils/pages/Auth";
import InterviewPage from "./utils/pages/interviewPage";
import InterviewHistory from "./utils/pages/interviewHistory";
import Pricing from "./utils/pages/pricing";
import InterviewReport from "./utils/pages/interviewReport";

import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userslice";

export const ServerUrl = "https://ai-interview-agent-9.onrender.com";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(
          ServerUrl + "/api/user/current-user",
          { withCredentials: true }
        );
        dispatch(setUserData(result.data));
      } catch (error) {
        console.log(error);
        dispatch(setUserData(null));
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<InterviewHistory />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/report" element={<InterviewReport />} />
    </Routes>
  );
}

export default App;
