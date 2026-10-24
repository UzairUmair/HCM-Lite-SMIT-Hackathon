import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function localGroqAssistant() {
  return {
    name: 'local-groq-assistant',
    configureServer(server) {
      server.middlewares.use('/api/local-ai', async (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; response.end(); return; }
        try {
          const body = await new Promise((resolveBody, reject) => {
            let raw = '';
            request.on('data', chunk => { raw += chunk; });
            request.on('end', () => resolveBody(JSON.parse(raw || '{}')));
            request.on('error', reject);
          });
          const question = String(body.question || '').trim();
          const role = ['admin', 'hr', 'employee'].includes(body.role) ? body.role : 'employee';
          if (!question || question.length > 1000) throw new Error('Enter a question of up to 1,000 characters.');
          const secret = readFileSync(resolve(process.cwd(), 'functions/.secret.local'), 'utf8').match(/^GROQ_API_KEY=(.+)$/m)?.[1]?.trim();
          if (!secret) throw new Error('Local Groq key is not configured.');
          const provider = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openai/gpt-oss-120b', temperature: 0.2, max_completion_tokens: 800, messages: [
              { role: 'system', content: `You are HCM Lite's helpful assistant for a ${role}. Give concise general HR and product guidance. You do not have access to live HCM records, so never claim counts, attendance, salaries, leave balances, or employee details.` },
              { role: 'user', content: question },
            ] }), signal: AbortSignal.timeout(15000),
          });
          const payload = await provider.json();
          const answer = payload?.choices?.[0]?.message?.content?.trim();
          if (!provider.ok || !answer) throw new Error('Groq could not answer right now. Please try again.');
          response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ answer }));
        } catch (error) {
          response.statusCode = 400; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ error: error.message || 'AI request failed.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [localGroqAssistant()],
  build: {
    rolldownOptions: {
      onwarn(warning, defaultHandler) {
        // React client directives are not needed in this client-only Vite app.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        defaultHandler(warning);
      },
      output: { codeSplitting: { groups: [
        { name: 'mui', test: /node_modules[\\/]@mui[\\/]/ },
        { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
      ] } },
    },
  },
});
