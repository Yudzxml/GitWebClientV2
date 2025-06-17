const axios = require('axios');

module.exports = async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'Referer': 'https://www.google.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    });

    // Set headers untuk respon proxy
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end('Stream error');
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
};