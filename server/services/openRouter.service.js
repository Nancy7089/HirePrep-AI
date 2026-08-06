import axios from "axios";

export const askAi = async (messages) => {
  try {
    // ✅ Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Message array is empty.");
    }

    // ✅ Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key missing in .env");
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",

          // ✅ Optional but recommended
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "InterviewIQ",
        },
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      throw new Error("AI returned empty response.");
    }

    return content;

  } catch (error) {
    // ✅ Show REAL error (VERY IMPORTANT)
    console.error(
      "🔥 OpenRouter Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message || error.message
    );
  }
};