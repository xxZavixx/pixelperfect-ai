// pages/api/claude.js
import Replicate from 'replicate';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'Idea is required' });
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN, // your Claude API token from Replicate
  });

  try {
    const output = await replicate.run(
      'anthropic/claude-3.7-sonnet',
      {
        input: {
          prompt: `Rewrite this idea to make it more descriptive and vivid for an AI image generator: "${idea}"`,
        },
      }
    );

    res.status(200).json({ enhanced: output.join('') }); // Claude returns an array of strings
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Claude enhancement failed' });
  }
}
