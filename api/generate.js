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
    const { prompt, images } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // Build message content — text only, or images + text
    let content;
    if (images && Array.isArray(images) && images.length > 0) {
      content = [
        ...images.map(img => ({
          type: "image_url",
          image_url: { url: img, detail: "high" }
        })),
        { type: "text", text: prompt }
      ];
    } else {
      content = prompt;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices[0].message.content;
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
