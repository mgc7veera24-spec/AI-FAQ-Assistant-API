const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// Gemini Request With Retry
// ==========================================
const generateWithRetry = async (prompt, maxRetries = 3) => {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    try {

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      });

      return response;

    } catch (error) {

      const message = error.message || "";

      const temporaryError =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand");

      if (!temporaryError || attempt === maxRetries) {
        throw error;
      }

      console.log(
        `Gemini temporarily unavailable. Retrying... (${attempt}/${maxRetries})`
      );

      const waitTime = attempt * 3000;

      await new Promise((resolve) => {
        setTimeout(resolve, waitTime);
      });
    }
  }
};


// ==========================================
// Generate FAQ
// ==========================================
const generateFAQ = async (topic) => {

  try {

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in .env");
    }

    const prompt = `
You are an AI FAQ assistant.

Generate one FAQ based on this topic:

${topic}

Return ONLY valid JSON in exactly this format:

{
  "question": "A clear FAQ question",
  "answer": "A helpful and simple answer",
  "category": "Technology"
}

The category must be exactly one of:

Technology
Education
Health
Banking
General

Rules:

- Use simple English.
- Correct spelling and grammar internally.
- Do not use Markdown.
- Do not use **.
- Do not use *.
- Do not use # headings.
- Do not use code blocks.
- Return ONLY JSON.
`;

    // IMPORTANT:
    // Use retry function here
    const response = await generateWithRetry(prompt);

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanText);

    return result;

  } catch (error) {

    throw new Error(
      `AI FAQ Generation failed: ${error.message}`
    );
  }
};


// ==========================================
// Generate AI Answer
// ==========================================
const generateAnswer = async (question) => {

  try {

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in .env");
    }

    const prompt = `
You are an AI FAQ assistant.

The user may type questions with:

- spelling mistakes
- typing mistakes
- grammar mistakes
- missing words
- incorrect capitalization

User question:

${question}

First understand the user's intended question.

Silently correct spelling and grammar mistakes.

Then answer the intended question.

IMPORTANT RULES:

1. Do not show the corrected question.
2. Do not mention spelling mistakes.
3. Use simple English.
4. Give a clear and accurate answer.
5. Keep the answer concise but useful.
6. Do not use Markdown.
7. Do not use **.
8. Do not use *.
9. Do not use # headings.
10. Do not use code blocks.
11. Return ONLY valid JSON.

Return exactly:

{
  "answer": "Your plain text answer here"
}
`;

    const response = await generateWithRetry(prompt);

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanText);

    return result.answer;

  } catch (error) {

    throw new Error(
      `AI Answer Generation failed: ${error.message}`
    );
  }
};


// ==========================================
// Export
// ==========================================
module.exports = {
  generateFAQ,
  generateAnswer
};