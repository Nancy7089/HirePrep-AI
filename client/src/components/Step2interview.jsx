import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsRobot, BsMic, BsMicMute, BsCheckCircle, BsVolumeUp, BsVolumeMute, BsLightning, BsCpu, BsCode } from "react-icons/bs";
import femalevideo from "../assets/female-ai.mp4";
import malevideo from "../assets/male-ai.mp4";
import axios from "axios";
import { ServerUrl } from "../App";

/* ─────────────────────────────────────────────────────────
   ADVANCED QUESTION GENERATOR — fallback if API gives < 5
───────────────────────────────────────────────────────── */
const ADVANCED_FALLBACK_QUESTIONS = [
  {
    question: "Design a distributed rate-limiter that handles 1 million requests per second across 100 microservices. Walk through your data structures, synchronisation strategy, and how you handle clock skew between nodes.",
    difficulty: "hard",
    timeLimit: 120,
  },
  {
    question: "You have a React app where a deeply nested component re-renders 60 times per second due to a context update. The profiler shows 80% of the CPU is wasted. Explain your full debugging and optimisation plan without refactoring to a state-management library.",
    difficulty: "hard",
    timeLimit: 120,
  },
  {
    question: "Implement LRU Cache with O(1) get and put in JavaScript. Now extend it to support TTL expiry and concurrency-safe reads in a multi-threaded Node.js worker pool. Describe every design decision.",
    difficulty: "hard",
    timeLimit: 90,
  },
  {
    question: "Walk me through the entire lifecycle of a HTTPS request — from DNS resolution, TCP handshake, TLS negotiation, HTTP/2 multiplexing to the byte reaching the browser's rendering engine. Where would you add observability hooks in production?",
    difficulty: "medium",
    timeLimit: 90,
  },
  {
    question: "You are the sole engineer tasked with reducing a monolithic Node.js API's p99 latency from 4 s to under 200 ms before a major product launch in 5 days. How do you triage, prioritise, and execute? What trade-offs are you willing to make?",
    difficulty: "hard",
    timeLimit: 120,
  },
];

/* Ensure exactly `count` questions exist, padding with advanced ones */
const ensureQuestions = (questions = [], count = 5) => {
  const result = [...questions];
  let i = 0;
  while (result.length < count) {
    result.push(ADVANCED_FALLBACK_QUESTIONS[i % ADVANCED_FALLBACK_QUESTIONS.length]);
    i++;
  }
  return result.slice(0, count); // never more than requested
};

/* ─────────────────────────────────────────────────────────
   TTS Helper
───────────────────────────────────────────────────────── */
const createSpeakText = (gender) => (text, { rate = 0.93, pitch = 1.08, onEnd } = {}) => {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = rate;
  utter.pitch = pitch;

  const voices = window.speechSynthesis.getVoices();
  const femalePreferred = ["samantha", "karen", "victoria", "zira", "female", "google us english", "google uk english female"];
  const malePreferred   = ["daniel", "alex", "fred", "google us english male", "david", "mark", "male"];
  const preferred = gender === "male" ? malePreferred : femalePreferred;
  const voice = voices.find((v) => preferred.some((p) => v.name.toLowerCase().includes(p)));
  if (voice) utter.voice = voice;

  if (onEnd) utter.onend = onEnd;
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
};

/* ─────────────────────────────────────────────────────────
   Waveform
───────────────────────────────────────────────────────── */
const Waveform = ({ active, color = "bg-green-400" }) => {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 1, 0.7, 0.4, 0.8, 0.6, 1];
  return (
    <div className="flex items-end gap-[3px] h-6">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${active ? color : "bg-white/20"}`}
          animate={active ? { scaleY: [h, h * 0.35, h * 1.3, h * 0.5, h] } : { scaleY: 0.12 }}
          transition={active ? { duration: 0.55 + i * 0.04, repeat: Infinity, ease: "easeInOut", delay: i * 0.03 } : { duration: 0.3 }}
          style={{ transformOrigin: "bottom", height: `${h * 22}px` }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   AI Caption
───────────────────────────────────────────────────────── */
const AiCaption = ({ text }) => (
  <AnimatePresence>
    {text && (
      <motion.div
        key="caption"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-300 leading-relaxed text-center w-full"
      >
        <span className="text-green-400 font-semibold mr-1">AI:</span>
        {text.length > 120 ? text.slice(0, 120) + "…" : text}
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────────────────────
   Difficulty Badge
───────────────────────────────────────────────────────── */
const difficultyConfig = {
  easy:   { color: "bg-emerald-100 text-emerald-600 border-emerald-200", label: "Easy",   icon: <BsCode size={10} /> },
  medium: { color: "bg-amber-100 text-amber-600 border-amber-200",       label: "Medium", icon: <BsCpu size={10} /> },
  hard:   { color: "bg-red-100 text-red-600 border-red-200",             label: "Hard",   icon: <BsLightning size={10} /> },
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
function Step2interview({ interviewData, infinish }) {
  const { interviewId, questions: rawQuestions, userName } = interviewData;

  // ── Guarantee exactly 5 questions ──
  const questions = useRef(ensureQuestions(rawQuestions, 5)).current;
  const totalQuestions = questions.length; // always 5

  // ── Randomly pick interviewer gender once per session ──
  const gender = useRef(Math.random() < 0.5 ? "female" : "male");
  const speakText = useRef(createSpeakText(gender.current)).current;

  const [phase, setPhase] = useState("intro");
  const [introAnswer, setIntroAnswer] = useState("");
  const [introSubmitted, setIntroSubmitted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 90);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiCaption, setAiCaption] = useState("");
  const [interimText, setInterimText] = useState("");
  const [videoPaused, setVideoPaused] = useState(false);
  const [score, setScore] = useState(null); // numeric score 0-10 parsed from feedback

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const recognitionRef = useRef(null);
  const voiceEnabledRef = useRef(true);
  const showFeedbackRef = useRef(false);
  const videoRef = useRef(null);
  const isListeningRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / totalQuestions) * 100;
  const timePercent = (timeLeft / (currentQuestion?.timeLimit || 90)) * 100;
  const timerColor = timePercent > 50 ? "#22c55e" : timePercent > 25 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (timePercent / 100) * circumference;

  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { showFeedbackRef.current = showFeedback; }, [showFeedback]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (videoPaused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [videoPaused]);

  /* ── Speak wrapper ── */
  const speak = useCallback((text, opts = {}) => {
    if (!voiceEnabledRef.current) { opts.onEnd?.(); return; }
    setIsSpeaking(true);
    setAiCaption(text);
    setVideoPaused(false);
    speakText(text, {
      ...opts,
      onEnd: () => {
        setIsSpeaking(false);
        setAiCaption("");
        opts.onEnd?.();
      },
    });
  }, [speakText]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setAiCaption("");
  };

  /* ── Parse score from feedback string ── */
  const parseScore = (fb = "") => {
    const match = fb.match(/\b([0-9]|10)\s*(?:\/\s*10|out of 10)\b/i);
    return match ? parseInt(match[1]) : null;
  };

  /* ══════════ ON MOUNT — greet ══════════ */
  useEffect(() => {
    const greet = () => {
      speak(
        `Hello ${userName}! Welcome to your AI-powered interview session. I am your interviewer today. ` +
        `We have ${totalQuestions} challenging questions prepared for you. ` +
        `Before we begin, please introduce yourself — share your name, educational background, technical skills, past experience, and what you are most passionate about.`
      );
    };
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (voices.length) greet(); else window.speechSynthesis.onvoiceschanged = greet;
    return () => { window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════ INTERVIEW PHASE — question + timer ══════════ */
  useEffect(() => {
    if (phase !== "interview") return;
    if (currentIndex >= totalQuestions) return; // guard against out-of-bounds

    setTimeLeft(currentQuestion?.timeLimit || 90);
    startTimeRef.current = Date.now();
    setAnswer("");
    setInterimText("");
    setShowFeedback(false);
    setSkipped(false);
    setWordCount(0);
    setScore(null);
    setVideoPaused(false);

    const prefix =
      currentIndex === 0 ? "Excellent! Let us begin. Here is your first question — take your time and think it through carefully."
      : currentIndex === totalQuestions - 1 ? `Outstanding progress! This is your final and most challenging question. Question ${currentIndex + 1}.`
      : `Good work. Moving to question ${currentIndex + 1} of ${totalQuestions}.`;

    speak(`${prefix} ${currentQuestion?.question}`);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 10 && voiceEnabledRef.current && !showFeedbackRef.current) {
          speakText("10 seconds remaining. Please wrap up your answer.");
        }
        if (prev <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  /* ── Word count ── */
  useEffect(() => {
    const words = answer.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(answer.trim() ? words : 0);
  }, [answer]);

  /* ══════════ INTRO SUBMIT ══════════ */
  const handleIntroSubmit = () => {
    stopListening();
    setIntroSubmitted(true);
    speak(
      `Thank you for that wonderful introduction, ${userName}! Let us now begin the interview. ` +
      `I have prepared ${totalQuestions} technical questions, ranging from medium to advanced difficulty. Think deeply before you answer. Good luck!`,
      { onEnd: () => setPhase("interview") }
    );
  };

  /* ══════════ SPEECH RECOGNITION ══════════ */
  const startListening = (target = "interview") => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Speech recognition is not supported. Please use Chrome.");
    stopSpeaking();
    setVideoPaused(true);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalBuffer = "";

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalBuffer += (finalBuffer ? " " : "") + t.trim();
        } else {
          interim += t;
        }
      }
      if (finalBuffer) {
        const captured = finalBuffer;
        finalBuffer = "";
        if (target === "intro") {
          setIntroAnswer((prev) => (prev ? prev + " " + captured : captured).trim());
        } else {
          setAnswer((prev) => (prev ? prev + " " + captured : captured).trim());
        }
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      if (isListeningRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); return; } catch {}
      }
      setIsListening(false);
      setInterimText("");
      setVideoPaused(false);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech") return;
      isListeningRef.current = false;
      setIsListening(false);
      setInterimText("");
      setVideoPaused(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText("");
    setVideoPaused(false);
  };

  /* ══════════ SUBMIT / SKIP / NEXT ══════════ */
  const handleAutoSubmit = async () => {
    if (showFeedbackRef.current) return;
    stopListening();
    setLoading(true);
    const taken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const result = await axios.post(`${ServerUrl}/api/interview/submit-answer`,
        { interviewId, questionIndex: currentIndex, answer, timetaken: taken },
        { withCredentials: true }
      );
      const fb = result.data.feedback;
      setFeedback(fb);
      setScore(parseScore(fb));
      setShowFeedback(true);
      speak(`Time is up! Here is my feedback. ${fb}`);
    } catch {
      setFeedback("Time's up! Your answer was auto-submitted.");
      setShowFeedback(true);
      speak("Time is up! Your answer has been submitted.");
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    stopListening();
    setLoading(true);
    const taken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const result = await axios.post(`${ServerUrl}/api/interview/submit-answer`,
        { interviewId, questionIndex: currentIndex, answer, timetaken: taken },
        { withCredentials: true }
      );
      const fb = result.data.feedback;
      setFeedback(fb);
      setScore(parseScore(fb));
      setShowFeedback(true);
      speak(`Good effort! Here is my detailed feedback. ${fb}`);
    } catch {
      setFeedback("Failed to evaluate your answer.");
      setShowFeedback(true);
    } finally { setLoading(false); }
  };

  const handleSkip = async () => {
    clearInterval(timerRef.current);
    stopListening();
    setSkipped(true);
    setLoading(true);
    const taken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const result = await axios.post(`${ServerUrl}/api/interview/submit-answer`,
        { interviewId, questionIndex: currentIndex, answer: "", timetaken: taken },
        { withCredentials: true }
      );
      const fb = result.data.feedback || "Question skipped.";
      setFeedback(fb);
      setShowFeedback(true);
      speak(`No worries. You skipped this question. ${fb}`);
    } catch {
      setFeedback("Question skipped.");
      setShowFeedback(true);
      speak("Question skipped. Let us move forward.");
    } finally { setLoading(false); }
  };

  /* ── KEY FIX: check against totalQuestions (5) correctly ── */
  const handleNext = async () => {
    stopSpeaking();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= totalQuestions) {
      // All 5 questions done → finish
      speak("Congratulations! You have completed all five questions. Excellent work today!", {
        onEnd: async () => {
          try {
            const result = await axios.post(`${ServerUrl}/api/interview/finish`, { interviewId }, { withCredentials: true });
            infinish(result.data);
          } catch { alert("Failed to finish interview."); }
        },
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  /* ══════════ RENDER ══════════ */
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl bg-[#1a1d27] rounded-3xl shadow-2xl border border-white/10 flex flex-col lg:flex-row overflow-hidden">

        {/* ══════ LEFT PANEL ══════ */}
        <div className="w-full lg:w-[32%] bg-gradient-to-b from-[#1e2130] to-[#1a1d27] flex flex-col items-center p-6 gap-5 border-r border-white/10">

          {/* Logo + mute */}
          <div className="flex items-center gap-3 self-start w-full">
            <div className="bg-green-500 text-white p-2 rounded-xl"><BsRobot size={16} /></div>
            <span className="font-bold text-white text-sm tracking-wide">InterviewIQ</span>
            <button
              onClick={() => { setVoiceEnabled((v) => !v); if (voiceEnabled) stopSpeaking(); }}
              className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition"
            >
              {voiceEnabled ? <BsVolumeUp size={13} /> : <BsVolumeMute size={13} />}
              {voiceEnabled ? "Mute" : "Unmute"}
            </button>
          </div>

          {/* Video */}
          <div className="relative w-full">
            {isSpeaking && <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-3xl animate-pulse" />}
            {videoPaused && <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-3xl animate-pulse" />}
            <div className={`relative w-full rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${isSpeaking ? "border-green-500/50" : videoPaused ? "border-blue-500/50" : "border-white/10"}`}>
              <video
                ref={videoRef}
                src={gender.current === "male" ? malevideo : femalevideo}
                autoPlay loop muted playsInline preload="auto"
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full animate-pulse ${videoPaused ? "bg-blue-400" : "bg-red-500"}`} />
                <span className="text-white text-[10px] font-medium">{videoPaused ? "PAUSED" : "LIVE"}</span>
              </div>
              {isSpeaking && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Waveform active={true} color="bg-green-400" />
                  <span className="text-green-400 text-[10px] font-medium ml-1">AI Speaking...</span>
                </div>
              )}
              {videoPaused && isListening && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Waveform active={true} color="bg-blue-400" />
                  <span className="text-blue-400 text-[10px] font-medium ml-1">Listening to you...</span>
                </div>
              )}
              {videoPaused && !isListening && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <div className="flex gap-1">
                      <div className="w-1 h-5 bg-white rounded-full" />
                      <div className="w-1 h-5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AiCaption text={aiCaption} />

          <AnimatePresence>
            {interimText && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-blue-300 italic"
              >
                <span className="text-blue-400 font-semibold not-italic mr-1">You:</span>
                {interimText}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center">
            <p className="text-white font-semibold">Hey, {userName} 👋</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {phase === "intro" ? "Please introduce yourself" : "Advanced AI Interview in progress"}
            </p>
          </div>

          {phase === "interview" && (
            <>
              {/* Question dots */}
              <div className="flex gap-2 flex-wrap justify-center">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    title={`Q${i + 1} — ${difficultyConfig[q?.difficulty]?.label || "?"}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 border ${
                      i < currentIndex
                        ? "bg-green-500 border-green-400"
                        : i === currentIndex
                        ? "bg-white scale-125 border-white"
                        : "bg-white/10 border-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Progress</span>
                  <span className="text-white font-medium">{currentIndex} / {totalQuestions} done</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <motion.div className="bg-green-500 h-1.5 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>

              {/* Difficulty legend */}
              <div className="flex gap-2 flex-wrap justify-center w-full">
                {questions.map((q, i) => {
                  const cfg = difficultyConfig[q?.difficulty] || { color: "bg-gray-100 text-gray-500 border-gray-200", label: "?", icon: null };
                  return (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 transition-all ${cfg.color} ${i === currentIndex ? "ring-2 ring-offset-1 ring-offset-[#1a1d27] ring-white/30" : "opacity-60"}`}
                    >
                      {cfg.icon} Q{i + 1}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ══════ RIGHT PANEL ══════ */}
        <div className="flex-1 flex flex-col p-8 gap-5 overflow-y-auto">

          {/* ── INTRO PHASE ── */}
          {phase === "intro" && (
            <AnimatePresence mode="wait">
              <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-5 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-bold text-xl">Self Introduction</h2>
                    <p className="text-gray-400 text-sm mt-0.5">Tell the AI interviewer about yourself</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-blue-100 text-blue-600 border-blue-200">Warm-up</span>
                </div>

                {/* Session info banner */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <BsLightning className="text-amber-400" size={14} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Advanced Interview — {totalQuestions} Questions</p>
                    <p className="text-gray-400 text-xs mt-0.5">Questions include system design, algorithms, optimisation, and debugging challenges</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Introduce Yourself</p>
                  <p className="text-white text-base font-medium leading-relaxed">
                    Please share a brief introduction — your name, educational background, technical skills, experience, and what drives you professionally.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Your name", "Education", "Skills", "Experience", "Passion"].map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={introAnswer}
                    onChange={(e) => setIntroAnswer(e.target.value)}
                    placeholder={isSpeaking ? "Wait for the AI to finish speaking..." : "Type or speak your introduction..."}
                    rows={6}
                    disabled={introSubmitted}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
                  />
                  {interimText && (
                    <div className="absolute bottom-10 left-4 right-4 text-xs text-blue-400 italic pointer-events-none">
                      {interimText}
                      <span className="inline-block w-1 h-3 bg-blue-400 ml-0.5 animate-pulse rounded-sm" />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-4 text-gray-600 text-xs">
                    {introAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {!introSubmitted && (
                  <div className="flex gap-3">
                    <button
                      onClick={isListening ? stopListening : () => startListening("intro")}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition ${isListening ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}
                    >
                      {isListening ? <BsMicMute size={16} /> : <BsMic size={16} />}
                      {isListening ? "Stop" : "Speak"}
                    </button>
                    <button
                      onClick={handleIntroSubmit}
                      disabled={!introAnswer.trim() || isSpeaking}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${!introAnswer.trim() || isSpeaking ? "bg-white/10 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20"}`}
                    >
                      Continue to Interview →
                    </button>
                  </div>
                )}

                {introSubmitted && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <BsCheckCircle className="text-green-400" size={16} />
                    </div>
                    <div>
                      <p className="text-green-400 text-sm font-semibold">Introduction received!</p>
                      <p className="text-gray-400 text-xs mt-0.5">{isSpeaking ? "AI is responding… Interview will begin shortly." : "Starting interview..."}</p>
                    </div>
                    {isSpeaking && <div className="ml-auto"><Waveform active={true} /></div>}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── INTERVIEW PHASE ── */}
          {phase === "interview" && currentIndex < totalQuestions && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1 ${difficultyConfig[currentQuestion?.difficulty]?.color || "bg-gray-100 text-gray-500"}`}>
                    {difficultyConfig[currentQuestion?.difficulty]?.icon}
                    {difficultyConfig[currentQuestion?.difficulty]?.label || "Unknown"}
                  </span>
                  <span className="text-gray-500 text-xs">Question {currentIndex + 1} of {totalQuestions}</span>
                </div>
                {/* Circular timer */}
                <div className="relative flex items-center justify-center w-14 h-14">
                  <svg className="absolute w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                  </svg>
                  <span className="text-white font-mono font-bold text-sm z-10">
                    {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-4 flex-1">

                  {isSpeaking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-green-400 text-xs">
                      <Waveform active={true} color="bg-green-400" />
                      <span className="font-medium">AI is reading the question...</span>
                    </motion.div>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Question {currentIndex + 1}</p>
                    <p className="text-white text-lg font-semibold leading-relaxed">{currentQuestion?.question}</p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={
                        isSpeaking ? "Listen to the question first..."
                        : isListening ? "Speak now — your voice is being transcribed..."
                        : "Type your answer or click Speak to use voice input..."
                      }
                      rows={5}
                      disabled={showFeedback || loading}
                      className={`w-full bg-white/5 border rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none transition ${isListening ? "border-blue-500/50 focus:ring-2 focus:ring-blue-500/30" : "border-white/10 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"}`}
                    />
                    {isListening && interimText && (
                      <div className="absolute bottom-10 left-4 right-4 text-xs text-blue-400 italic pointer-events-none">
                        {interimText}
                        <span className="inline-block w-0.5 h-3 bg-blue-400 ml-0.5 animate-pulse rounded-sm" />
                      </div>
                    )}
                    <div className="absolute bottom-3 right-4 flex items-center gap-3">
                      {isListening && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                          <Waveform active={true} color="bg-blue-400" />
                        </motion.div>
                      )}
                      <span className={`text-xs ${wordCount > 50 ? "text-green-400" : wordCount > 20 ? "text-amber-400" : "text-gray-600"}`}>
                        {wordCount} words {wordCount < 20 && wordCount > 0 ? "— try to elaborate more" : ""}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-blue-300 text-xs font-medium">Transcribing your voice in real-time...</span>
                        <span className="ml-auto text-gray-500 text-xs">Video paused</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showFeedback && (
                    <div className="flex gap-3">
                      <button
                        onClick={isListening ? stopListening : () => startListening("interview")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition ${isListening ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}
                      >
                        {isListening ? (<><BsMicMute size={16} /><Waveform active={true} color="bg-blue-400" /></>) : (<><BsMic size={16} />Speak</>)}
                      </button>
                      <button
                        onClick={() => speak(`Question ${currentIndex + 1}. ${currentQuestion?.question}`)}
                        disabled={isSpeaking || !voiceEnabled}
                        title="Repeat question"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-white/10 text-gray-400 hover:bg-white/5 transition disabled:opacity-40"
                      >
                        <BsVolumeUp size={16} />
                      </button>
                      <button
                        onClick={handleSkip}
                        disabled={loading || showFeedback}
                        className="px-5 py-3 rounded-xl text-sm font-medium border border-white/10 text-gray-400 hover:bg-white/5 transition disabled:opacity-40"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !answer.trim()}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${loading || !answer.trim() ? "bg-white/10 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20"}`}
                      >
                        {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Evaluating...</>) : "Submit Answer →"}
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {showFeedback && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-green-400 font-semibold mb-3">
                          <BsCheckCircle size={16} />
                          AI Feedback
                          {skipped && <span className="ml-2 text-xs text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-full">Skipped</span>}
                          {score !== null && (
                            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${score >= 7 ? "bg-green-500/20 text-green-300" : score >= 4 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                              {score}/10
                            </span>
                          )}
                          {isSpeaking && <span className="ml-auto"><Waveform active={true} color="bg-green-400" /></span>}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{feedback}</p>
                        <button
                          onClick={handleNext}
                          disabled={isSpeaking}
                          className={`mt-4 w-full py-3 rounded-xl text-sm font-semibold transition shadow-lg ${isSpeaking ? "bg-white/10 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-400 text-white shadow-green-500/20"}`}
                        >
                          {isSpeaking
                            ? "AI is speaking..."
                            : currentIndex + 1 >= totalQuestions
                            ? "Finish Interview 🎉"
                            : `Next Question → (${currentIndex + 1}/${totalQuestions})`}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2interview;
