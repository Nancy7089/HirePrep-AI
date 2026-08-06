import React, { useState } from "react";
import { motion } from "framer-motion";
import { BsRobot, BsCheckLg, BsLightning, BsCoin } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const plans = [
  {
    name: "Starter",
    credits: 200,
    price: "₹49",
    usd: "$0.59",
    icon: "🌱",
    color: "border-gray-200",
    badge: null,
    perks: [
      "200 credits",
      "4 full interview sessions",
      "AI answer evaluation",
      "PDF report download",
      "Voice interview support",
    ],
    cta: "Get Started",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-800",
  },
  {
    name: "Pro",
    credits: 600,
    price: "₹129",
    usd: "$1.55",
    icon: "⚡",
    color: "border-green-500",
    badge: "Most Popular",
    perks: [
      "600 credits",
      "12 full interview sessions",
      "AI answer evaluation",
      "PDF report download",
      "Voice interview support",
      "Resume-based questions",
      "History & Analytics",
    ],
    cta: "Go Pro",
    ctaStyle: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200",
  },
  {
    name: "Elite",
    credits: 1500,
    price: "₹299",
    usd: "$3.60",
    icon: "🏆",
    color: "border-amber-400",
    badge: "Best Value",
    perks: [
      "1500 credits",
      "30 full interview sessions",
      "AI answer evaluation",
      "PDF report download",
      "Voice interview support",
      "Resume-based questions",
      "History & Analytics",
      "Priority AI response",
    ],
    cta: "Go Elite",
    ctaStyle: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100",
  },
];

const faqs = [
  {
    q: "What are credits?",
    a: "Each interview session costs 50 credits. Credits never expire and are added to your account instantly after purchase.",
  },
  {
    q: "How many questions per session?",
    a: "Each session has 5 questions — adaptive difficulty based on your role and experience level.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer refunds within 48 hours of purchase if you haven't used any credits. Contact support.",
  },
  {
    q: "Is payment secure?",
    a: "Yes. All payments are processed via Razorpay / Stripe with industry-standard encryption.",
  },
];

function pricing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <Navbar />

      <div className="flex-1 px-4 py-14">
        <div className="max-w-6xl mx-auto">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-white border px-5 py-2 rounded-full text-sm text-gray-600 shadow-sm mb-5">
              <BsCoin className="text-yellow-500" />
              Credit-based — pay only for what you use
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Invest in your{" "}
              <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full inline-block text-3xl md:text-4xl">
                Interview Skills
              </span>
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Buy credits once, use them whenever. No subscriptions, no hidden fees.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`relative bg-white rounded-3xl border-2 ${plan.color} p-8 shadow-sm hover:shadow-md transition flex flex-col`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs px-4 py-1 rounded-full font-semibold flex items-center gap-1.5 whitespace-nowrap">
                      <HiSparkles size={12} />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm mb-1">{plan.usd}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <BsCoin className="text-yellow-500" size={14} />
                    <span className="text-sm font-semibold text-gray-600">
                      {plan.credits} credits
                    </span>
                    <span className="text-gray-400 text-xs">
                      ({plan.credits / 50} sessions)
                    </span>
                  </div>
                </div>

                {/* Perks */}
                <ul className="flex flex-col gap-3 flex-1 mb-8">
                  {plan.perks.map((perk, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <BsCheckLg className="text-green-500 flex-shrink-0" size={14} />
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/interview")}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Credit usage breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 mb-20 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              How Credits Work
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: "🚀", title: "Start Interview", cost: "50 credits", desc: "Generates 5 AI-powered questions for your role and experience." },
                { icon: "🎯", title: "Answer Evaluated", cost: "Included", desc: "Each answer is scored for confidence, communication and correctness." },
                { icon: "📄", title: "Download Report", cost: "Free", desc: "Get a detailed PDF report with strength and improvement insights." },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 bg-gray-50 rounded-2xl">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                  <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold mb-2">
                    {item.cost}
                  </span>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-2xl mx-auto flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-gray-700">{faq.q}</span>
                    <span className="text-gray-400 text-xl">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-gray-500">{faq.a}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-10 text-center text-white shadow-xl shadow-green-200"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <BsLightning size={28} />
              </div>
            </div>
            <h2 className="text-3xl font-black mb-2">Ready to ace your next interview?</h2>
            <p className="text-green-100 mb-6 max-w-md mx-auto">
              Start with 100 free credits on signup. No credit card required.
            </p>
            <button
              onClick={() => navigate("/interview")}
              className="bg-white text-green-700 font-bold px-10 py-3 rounded-full hover:scale-105 transition shadow-lg"
            >
              Start For Free 🚀
            </button>
          </motion.div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default pricing;
