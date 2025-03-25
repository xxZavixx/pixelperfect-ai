// pages/api/enhance.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'Idea is required' });
  }

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3-0324", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `Rewrite this image idea to be more vivid and detailed: "${idea}"`,
        parameters: { max_new_tokens: 100, temperature: 0.7 }
      })
    });

    const result = await response.json();

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    const enhanced = result?.[0]?.generated_text || "Unable to generate prompt";
    res.status(200).json({ enhanced });

  } catch (error) {
    console.error("DeepSeek API error:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
}
