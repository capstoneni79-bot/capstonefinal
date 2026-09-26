import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createApp } from './src/server/app.ts';
import { initPostgresTables } from './src/db/index.ts';

async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Attempt non-blocking DB initialization for Supabase / PostgreSQL
  initPostgresTables().catch(err => {
    console.warn('PostgreSQL table initialization notice:', err?.message || err);
  });

  // Vite middleware for development vs static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 DA Hinunangan Swine Registry`);
    console.log(`  ➜ Local:   http://localhost:${PORT}`);
    console.log(`  ➜ Network: http://127.0.0.1:${PORT}\n`);
  });
}

startServer();
