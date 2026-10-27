export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://wesdlpteam.github.io",
    "http://localhost:5500",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, filename, language } = req.body;
    if (!audio) return res.status(400).json({ error: "No audio provided" });

    const base64Data = audio.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    const mimeMatch = audio.match(/^data:(audio\/[^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "audio/mpeg";

    const blob = new Blob([buffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, filename || "audio.mp3");
    formData.append("model", "whisper-1");
    if (language) formData.append("language", language);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    return res.status(200).json({ text: data.text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
