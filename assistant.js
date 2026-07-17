// api/assistant.js
//
// Vercel Serverless Function — this is the ONLY place the Gemini API key
// lives. It never reaches the browser. The key is read from the
// GEMINI_API_KEY environment variable, which you set in the Vercel
// dashboard (Project → Settings → Environment Variables), not in this file.
//
// Endpoint: POST /api/assistant
// Body:     { "message": "ユーザーの質問", "lang": "ja" | "en" }
// Response: { "reply": "アシスタントの回答" }

const SYSTEM_PROMPT = {
  ja: `あなたは「2E Spectrum」という教育サイトのAIアシスタントです。
このサイトは、ギフテッド（gifted）、ニューロダイバーシティ（neurodiversity）、
2E（二重に特別な才能／twice-exceptionality）について、15歳以上の学生・保護者・
教育者に向けて、研究に基づいた正確な情報をわかりやすく伝えることを目的として
います。

回答のルール：
- 常に丁寧で、支援的、包摂的な日本語で答えてください。
- 断定的な医療診断や心理診断は行わないでください。あくまで一般的な教育情報の
  提供にとどめ、個別の診断や治療が必要な場合は専門家（医師・心理士・スクール
  カウンセラーなど）に相談するよう案内してください。
- 回答は簡潔に、3〜5文程度を目安にしてください。
- サイト内の関連セクション（例:「ギフテッドとは」「ニューロダイバーシティとは」
  「2Eとは」「強みと困難」「評価と特定」「教育支援」など）があれば、その名称を
  添えて案内してください。
- サイトの内容と無関係な質問（雑談、他分野の専門的な質問など）には、やんわりと
  スコープ外であることを伝え、サイトのテーマに話を戻してください。`,
  en: `You are the AI assistant for "2E Spectrum," an educational website about
giftedness, neurodiversity, and twice-exceptionality (2E), built for students,
parents, and educators aged 15 and up. Your job is to explain research-based
information clearly and supportively.

Response rules:
- Always answer in a warm, professional, inclusive tone.
- Do not give medical or psychological diagnoses. Stick to general educational
  information, and suggest consulting a qualified professional (doctor,
  psychologist, school counselor, etc.) for individual assessment or treatment
  needs.
- Keep answers concise — roughly 3-5 sentences.
- When relevant, point the user to the matching section of the site (e.g.
  "What is Giftedness?", "What is Neurodiversity?", "What is 2E?",
  "Challenges & Strengths", "Identification & Assessment", "Educational
  Support").
- If a question is unrelated to the site's topics, gently note that it's
  outside your scope and steer the conversation back to giftedness, 2E, or
  neurodiversity.`,
};

export default async function handler(req, res) {
  // Allow the browser to call this endpoint (adjust origin in production
  // if you want to lock it down to your own domain only).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables.",
    });
  }

  try {
    const { message, lang } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message too long." });
    }

    const safeLang = lang === "en" ? "en" : "ja";
    const systemPrompt = SYSTEM_PROMPT[safeLang];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.6,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return res.status(502).json({
        error:
          safeLang === "ja"
            ? "AIサービスへの接続に失敗しました。しばらくしてから再度お試しください。"
            : "Failed to reach the AI service. Please try again in a moment.",
      });
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      (safeLang === "ja"
        ? "すみません、うまく回答できませんでした。もう一度お試しください。"
        : "Sorry, I couldn't generate a reply. Please try again.");

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("assistant.js error:", err);
    const safeLang = req.body?.lang === "en" ? "en" : "ja";
    return res.status(500).json({
      error:
        safeLang === "ja"
          ? "サーバーでエラーが発生しました。"
          : "A server error occurred.",
    });
  }
}
