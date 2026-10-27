export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  // CORS
  const allowed = ["https://wesdlpteam.github.io", "http://127.0.0.1:5500", "http://localhost:5500"];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { audio, filename } = req.body;
    if (!audio || !filename) return res.status(400).json({ error: "Missing audio or filename" });

    // Extract pure base64 from data URI
    const base64Only = audio.replace(/^data:audio\/[^;]+;base64,/, "");

    // Build a safe, unique filename
    const ts = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
    const uploadName = `${ts}_${safeName}`;

    // Upload to GitHub via Contents API
    const GH_TOKEN = process.env.GH_AUDIO_TOKEN;
    const GH_OWNER = "wesdlpteam";
    const GH_REPO = "wesdlpteam.github.io";
    const GH_PATH = "quiz-audio";

    const ghRes = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}/${uploadName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload quiz audio: ${safeName}`,
          content: base64Only,
        }),
      }
    );

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return res.status(502).json({ error: `GitHub upload failed (${ghRes.status}): ${err.message || "Unknown"}` });
    }

    // Return the public GitHub Pages URL
    const publicURL = `https://${GH_OWNER}.github.io/${GH_PATH}/${uploadName}`;
    return res.status(200).json({ url: publicURL });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
