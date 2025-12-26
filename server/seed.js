import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { Item } from './models/Item.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfshare';
const shouldDrop = process.argv.includes('--drop');

async function loadMockItemsFromFrontend() {
  // We reuse the existing front-end mock list to seed the DB, but we convert
  // the TS file into a tiny ESM module on the fly.
  const mockPath = path.join(rootDir, 'src', 'data', 'mockItems.ts');
  const tempPath = path.join(__dirname, '.tmp_mockItems.mjs');
  const ts = await fs.readFile(mockPath, 'utf8');

  // Remove the TS-only import and type annotation on the export.
  const js = ts
    .replace(/^import[^;]+;\s*/m, '')
    .replace(/export const mockItems\s*:\s*Item\[\]\s*=/, 'export const mockItems =');

  await fs.writeFile(tempPath, js, 'utf8');
  const mod = await import(pathToFileURL(tempPath).href);
  await fs.unlink(tempPath).catch(() => undefined);
  return mod.mockItems;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log('[seed] Connected to MongoDB');

  if (shouldDrop) {
    await Item.deleteMany({});
    // eslint-disable-next-line no-console
    console.log('[seed] Cleared existing items');
  }

  const mockItems = await loadMockItemsFromFrontend();
  let upserted = 0;

  for (const item of mockItems) {
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : createdAt;

    await Item.updateOne(
      { id: item.id },
      {
        $set: {
          ...item,
          createdAt,
          updatedAt,
        },
      },
      { upsert: true }
    );
    upserted += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Upserted ${upserted} items`);
  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log('[seed] Done');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
