import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../../App";
import Step3Report from "../../components/Step3Report";
import Navbar from "../../components/Navbar";

function InterviewReport() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No interview ID provided.");
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/interview/report/${id}`, {
          withCredentials: true,
        });
        setReport(result.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-4">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => navigate("/history")}
            className="bg-green-600 text-white px-6 py-3 rounded-full text-sm"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <Navbar />
      <Step3Report report={report} />
    </div>
  );
}

export default InterviewReport;
