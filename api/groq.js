export default async function handler(req, res) {
    // CORS Configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-groq-key'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get API Key from headers or environment variables
    const getApiKey = (req) => {
        const headerKey = req.headers['x-groq-key'];
        if (headerKey && headerKey.startsWith('gsk_')) return headerKey;
        return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    };

    const apiKey = getApiKey(req);
    if (!apiKey) {
        return res.status(400).json({ error: 'Missing GROQ_API_KEY on server' });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse the response from Groq
        const data = await response.json();

        // Forward the status and data
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('Groq Proxy Error:', error);
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Upstream timed out after 30s' });
        }
        return res.status(500).json({ error: 'Proxy error', details: error.message });
    }
}
