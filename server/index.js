import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import itemsRouter from './routes/items.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/items', itemsRouter);

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfshare';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    // eslint-disable-next-line no-console
    console.log(`[server] Connected to MongoDB`);

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
