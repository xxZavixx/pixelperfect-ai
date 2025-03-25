import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_CLAUDE_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: "Idea is required" });
  }

  try {
    const output = await replicate.run(
      "anthropic/claude-3.7-sonnet",
      {
        input: {
          prompt: `Rewrite this idea to make it more descriptive and vivid for an AI image generator: "${idea}"`,
        }
      }
    );

    const result = Array.isArray(output) ? output.join("") : output;
    res.status(200).json({ enhanced: result });
  } catch (error) {
    console.error("Claude error:", error);
    res.status(500).json({ error: "Something went wrong with Claude." });
  }
}
