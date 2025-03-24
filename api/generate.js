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
        version: "a9758cbf44a3794dd1ec8fdf6cd3a4ac066693b8ad0e3c7ba7c3b49a2c3d0e74", // Stable Diffusion v1.5
        input: {
          prompt: prompt
        }
      })
    });

    const prediction = await replicateResponse.json();

    if (!prediction?.urls?.get) {
      return res.status(500).json({ error: 'Failed to start image generation' });
    }

    // Poll the status until the image is generated
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
        return res.status(500).json({ error: 'Image generation failed' });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before next poll
    }

    res.status(200).json({ image_url: imageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
