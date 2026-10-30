import { defineConfig, loadEnv } from 'vite';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

function groqProxy(env) {
  return {
    name: 'bharat-healthnet-groq-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res, next) => {
        if (req.method === 'OPTIONS') return json(res, 204, {});
        if (req.method !== 'POST') return next();
        if (!env.GROQ_API_KEY) return json(res, 503, { error: 'AI is not configured. Add GROQ_API_KEY to .env.local.' });

        try {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 20_000) return json(res, 413, { error: 'Request is too large.' });
          }
          const body = JSON.parse(raw || '{}');
          const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2_000) : '';
          if (!message) return json(res, 400, { error: 'Ask a question about the operations network.' });

          const context = JSON.stringify(body.context || {}).slice(0, 12_000);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20_000);
          let upstream;
          try {
            upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
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
          if (!upstream.ok) return json(res, upstream.status >= 500 ? 502 : upstream.status, { error: result.error?.message || 'Groq could not answer this request.' });
          return json(res, 200, { response: result.choices?.[0]?.message?.content?.trim() || 'No response returned.' });
        } catch (error) {
          return json(res, error.name === 'AbortError' ? 504 : 500, { error: error.name === 'AbortError' ? 'The AI request timed out. Try again.' : 'The AI service could not be reached.' });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [groqProxy(env)], server: { host: '127.0.0.1' } };
});
