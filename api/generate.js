export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: { prompt }
      })
    });

    const prediction = await replicateResponse.json();

    console.log("Replicate raw response:", prediction);

    if (!prediction?.urls?.get) {
      return res.status(500).json({ error: 'Failed to start image generation' });
    }

    let imageUrl = null;

    while (!imageUrl) {
      const pollRes = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded') {
        imageUrl = pollData.output[0];
      } else if (pollData.status === 'failed') {
        console.error("Prediction failed:", pollData);
        return res.status(500).json({ error: 'Image generation failed' });
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before polling again
    }

    res.status(200).json({ image_url: imageUrl });

  } catch (error) {
    console.error("Catch error:", error);
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
}
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
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "e7f48c998bcdd0f0bfa07bf0f9ce363260bce0729f1f818cd91c8c51df3c3b79", // Claude 3.7 Sonnet
        input: {
          prompt: `Rewrite this idea to make it more descriptive and vivid for an AI image generator: "${idea}"`,
          max_tokens: 120,
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
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
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
