import express from 'express';
import crypto from 'crypto';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { requireAuth } from '../lib/auth.js';
import { getBadgeFromPoints } from '../lib/badges.js';
import { toClientItem } from '../lib/serializers.js';

const router = express.Router();

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const { status, category, ownerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (ownerId) filter.ownerId = ownerId;

    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items.map((i) => toClientItem(i)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(toClientItem(item));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST /api/items
router.post('/', requireAuth(), async (req, res) => {
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
      ownerId: req.user.id,
      ownerName: req.user.name,
      ownerAvatar: req.user.avatar || '',
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json(toClientItem(created));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// POST /api/items/:id/claim (donation)
router.post('/:id/claim', requireAuth(), async (req, res) => {
  try {
    const item = await Item.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.type !== 'donation') return res.status(400).json({ error: 'Only donations can be claimed' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Item is not available' });
    if (item.ownerId === req.user.id) return res.status(400).json({ error: 'You cannot claim your own item' });

    item.status = 'taken';
    item.claimedBy = req.user.id;
    item.claimedByName = req.user.name;
    item.claimedAt = new Date();
    await item.save();

    // Award the owner 1 donor point.
    const owner = await User.findOne({ id: item.ownerId });
    if (owner) {
      owner.donorPoints = Number(owner.donorPoints || 0) + 1;
      owner.badge = getBadgeFromPoints(owner.donorPoints);
      await owner.save();
    }

    res.json(toClientItem(item));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to claim item' });
  }
});

// PATCH /api/items/:id
router.patch('/:id', requireAuth(), async (req, res) => {
  try {
    const updates = req.body || {};
    const item = await Item.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own items' });
    }

    // Only allow a safe subset of fields to be edited by owners.
    const allowed = ['title', 'description', 'category', 'tags', 'condition', 'rating', 'images', 'type', 'status'];
    const safe = {};
    for (const k of allowed) {
      if (k in updates) safe[k] = updates[k];
    }

    const updated = await Item.findOneAndUpdate(
      { id: req.params.id },
      { $set: safe },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(toClientItem(updated));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', requireAuth(), async (req, res) => {
  try {
    const item = await Item.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }

    const deleted = await Item.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
