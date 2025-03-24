export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'Idea is required' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.CLAUDE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "e7f48c998bcdd0f0bfa07bf0f9ce363260bce0729f1f818cd91c8c51df3c3b79", // Claude 3.7 Sonnet
        input: {
          prompt: `Rewrite this idea to make it more descriptive and vivid for an AI image generator: "${idea}"`,
          max_tokens: 300,
          temperature: 0.7
        }
      })
    });

    const prediction = await response.json();

    if (!prediction?.urls?.get) {
      return res.status(500).json({ error: 'Failed to start enhancement' });
    }

    let result = null;
    while (!result) {
      const poll = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${process.env.CLAUDE_API_TOKEN}`
        }
      });

      const data = await poll.json();

      if (data.status === 'succeeded') {
        result = data.output;
        break;
      } else if (data.status === 'failed') {
        return res.status(500).json({ error: 'Enhancement failed' });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    res.status(200).json({ enhanced: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}