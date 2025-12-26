import express from 'express';
import crypto from 'crypto';
import { Item } from '../models/Item.js';

const router = express.Router();

function toClient(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const { status, category, ownerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (ownerId) filter.ownerId = ownerId;

    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items.map((i) => toClient(i)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(toClient(item));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST /api/items
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.title || !data.description || !data.category) {
      return res.status(400).json({ error: 'title, description, category are required' });
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const created = await Item.create({
      ...data,
      id,
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json(toClient(created));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /api/items/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const updated = await Item.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(toClient(updated));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Item.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
