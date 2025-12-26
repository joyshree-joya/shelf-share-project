import express from 'express';
import crypto from 'crypto';

import { requireAuth } from '../lib/auth.js';
import { ExchangeRequest } from '../models/ExchangeRequest.js';
import { Item } from '../models/Item.js';
import { toClientExchange } from '../lib/serializers.js';

const router = express.Router();

// GET /api/exchanges  -> returns both incoming and outgoing for the current user
router.get('/', requireAuth(), async (req, res) => {
  try {
    const uid = req.user.id;
    const reqs = await ExchangeRequest.find({
      $or: [{ ownerId: uid }, { requesterId: uid }],
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(reqs.map((r) => toClientExchange(r)));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch exchange requests' });
  }
});

// POST /api/exchanges
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { itemId, offeredItemId, message } = req.body || {};
    if (!itemId || !offeredItemId) {
      return res.status(400).json({ error: 'itemId and offeredItemId are required' });
    }

    const item = await Item.findOne({ id: itemId });
    const offered = await Item.findOne({ id: offeredItemId });
    if (!item || !offered) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.ownerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot request your own item' });
    }
    if (offered.ownerId !== req.user.id) {
      return res.status(400).json({ error: 'You can only offer items you own' });
    }
    if (item.type !== 'exchange') {
      return res.status(400).json({ error: 'This item is not available for exchange' });
    }
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'This item is not currently available' });
    }
    if (offered.status !== 'available') {
      return res.status(400).json({ error: 'Your offered item is not available' });
    }

    // Mark the requested item as pending while the owner decides.
    item.status = 'pending';
    await item.save();

    const created = await ExchangeRequest.create({
      id: crypto.randomUUID(),
      itemId: item.id,
      itemTitle: item.title,
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      requesterId: req.user.id,
      requesterName: req.user.name,
      offeredItemId: offered.id,
      offeredItemTitle: offered.title,
      message: typeof message === 'string' ? message : '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json(toClientExchange(created));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create exchange request' });
  }
});

// PATCH /api/exchanges/:id/respond
router.patch('/:id/respond', requireAuth(), async (req, res) => {
  try {
    const accept = !!req.body?.accept;

    const request = await ExchangeRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can respond to this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    const item = await Item.findOne({ id: request.itemId });
    const offered = await Item.findOne({ id: request.offeredItemId });

    if (!item || !offered) {
      return res.status(404).json({ error: 'Related item not found' });
    }

    if (accept) {
      request.status = 'accepted';
      request.respondedAt = new Date();
      await request.save();

      item.status = 'taken';
      offered.status = 'taken';
      await item.save();
      await offered.save();
    } else {
      request.status = 'rejected';
      request.respondedAt = new Date();
      await request.save();

      // Put the requested item back as available.
      item.status = 'available';
      await item.save();
    }

    res.json(toClientExchange(request));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to respond to exchange request' });
  }
});

export default router;
