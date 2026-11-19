require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) });
});

app.post("/api/chat", async (req, res) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({ error: "שרת ה-AI עדיין לא הוגדר. יש להוסיף את פרטי Cloudflare במשתני הסביבה של Render." });
  }

  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "לא התקבלה שיחה תקינה." });
  }

  const safeMessages = messages.slice(-24).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: String(message.content || "").slice(0, 12000)
  })).filter((message) => message.content.trim());

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return res.status(400).json({ error: "ההודעה האחרונה חייבת להיות הודעת משתמש." });
  }

  try {
    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(accountId) + "/ai/run/" + encodeURIComponent(MODEL),
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful, clear assistant. Reply in the language used by the user. Support Hebrew and English." },
            ...safeMessages
          ]
        })
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const detail = data.errors && data.errors[0] && data.errors[0].message;
      return res.status(502).json({ error: detail || "שירות Cloudflare לא הצליח להשיב. בדוק את הגדרות המודל והטוקן." });
    }

    const result = data.result || {};
    const answer = result.response || result.output_text || (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content);
    if (!answer) return res.status(502).json({ error: "התקבלה תשובה ריקה משירות ה-AI." });
    res.json({ reply: String(answer), model: MODEL });
  } catch (error) {
    console.error("Workers AI request failed:", error.message);
    res.status(502).json({ error: "לא ניתן להתחבר כרגע לשירות ה-AI. נסה שוב בעוד רגע." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log("Atar AI is listening on port " + PORT));
