export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI is not configured. Add GROQ_API_KEY to Vercel environment variables.' });
  }

  try {
    const body = req.body || {};
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    if (!message) {
      return res.status(400).json({ error: 'Ask a question about the operations network.' });
    }

    const context = JSON.stringify(body.context || {}).slice(0, 12000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let upstream;
    try {
      upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            { role: 'system', content: 'You are Bharat HealthNet Operations Copilot. Give concise, practical answers for healthcare operations using only the supplied synthetic context. Never diagnose, prescribe, or provide treatment advice. If asked for clinical advice, refuse briefly and redirect to a qualified clinician. Label uncertainty and recommend human review before any real-world action. Use Indian locations and units from the context when relevant.' },
            { role: 'user', content: `Current synthetic command-center context:\n${context}\n\nOperator question:\n${message}` }
          ]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status >= 500 ? 502 : upstream.status).json({
        error: result.error?.message || 'Groq could not answer this request.'
      });
    }

    return res.status(200).json({
      response: result.choices?.[0]?.message?.content?.trim() || 'No response returned.'
    });
  } catch (error) {
    return res.status(error.name === 'AbortError' ? 504 : 500).json({
      error: error.name === 'AbortError' ? 'The AI request timed out. Try again.' : 'The AI service could not be reached.'
    });
  }
}
