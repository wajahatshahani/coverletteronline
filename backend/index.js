const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files from 'public' folder
app.use(express.static(path.join(__dirname, "../public")));

// Check for Gemini API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env!");
  process.exit(1);
}

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API endpoint to generate cover letter
app.post("/generate", async (req, res) => {
  const { name, jobTitle, company, experience, skills, tone } = req.body;

  // Validate required fields
  if (!name || !jobTitle || !company) {
    return res.status(400).json({ error: "Name, Job Title, and Company are required." });
  }

  // Construct the AI prompt
  const prompt = `
You are a professional career writer.

Write a professional, human-like, recruiter-friendly cover letter for the following applicant and job:

Rules:
- Do NOT include any placeholders or bracketed text like [Your Name], [Address], [Phone Number], [Email], [LinkedIn], or [Date].
- Include ONLY the details provided below.
- If a detail is missing, skip it. Do NOT invent addresses, platforms, or instructions.
- Start directly with the letter content.
- Keep it concise (~3–4 paragraphs, ~180 words).
- End with a confident closing and include ONLY the applicant's name in the signature line.

Applicant Details:
Name: ${name}
Experience: ${experience}
Skills: ${skills}

Job Details:
Job Title: ${jobTitle}
Company/Institution: ${company}
Tone: ${tone || "Professional"}

Output:
Return ONLY the finished cover letter text.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      temperature: 0.7,
      maxOutputTokens: 500
    });

    // Extract generated text
    let coverLetter = response.candidates?.[0]?.content?.text || "";

    // Remove any leftover placeholders just in case
    coverLetter = coverLetter.replace(/\[.*?\]/g, "").trim();

    if (!coverLetter) {
      return res.status(500).json({ error: "AI returned empty response." });
    }

    res.json({ coverLetter });

  } catch (error) {
    console.error("AI Generation Error:", error.response?.data || error.message || error);
    res.status(500).json({ error: "Failed to generate cover letter. Check API key and network." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
