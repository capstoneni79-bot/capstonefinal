import { app } from './app.ts';
import { initPostgresTables } from '../db/index.ts';

let isDbInitialized = false;

async function handler(req: any, res: any) {
  // Normalize req.url so Express routes matching /api/* work reliably on Vercel
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  if (!isDbInitialized) {
    try {
      await initPostgresTables();
      isDbInitialized = true;
    } catch (err) {
      console.warn('Vercel serverless DB initialization notice:', err);
    }
  }
  return app(req, res);
}

export default handler;

// Ensure CommonJS module.exports is set for Vercel Serverless runtime
// @ts-ignore
if (typeof module !== 'undefined' && module) {
  // @ts-ignore
  module.exports = handler;
  // @ts-ignore
  module.exports.default = handler;
}
