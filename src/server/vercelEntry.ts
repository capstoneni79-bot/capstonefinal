import { app } from './app.ts';
import { initPostgresTables } from '../db/index.ts';

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
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
