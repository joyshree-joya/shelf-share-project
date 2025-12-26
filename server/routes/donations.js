import express from 'express';
import crypto from 'crypto';
import { requireAuth } from '../lib/auth.js';
import { DonationRequest } from '../models/DonationRequest.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { getBadgeFromPoints } from '../lib/badges.js';
import { toClientItem } from '../lib/serializers.js';

const router = express.Router();

// GET /api/donations/requests
router.get('/requests', requireAuth(), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [{ ownerId: req.user.id }, { requesterId: req.user.id }],
    };
    if (status) filter.status = status;

    const requests = await DonationRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch donation requests' });
  }
});

// POST /api/donations/requests
// Creates a donation request and puts the item on hold.
router.post('/requests', requireAuth(), async (req, res) => {
  try {
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const item = await Item.findOne({ id: itemId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.type !== 'donation') return res.status(400).json({ error: 'Only donations can be requested' });
    if (item.ownerId === req.user.id) return res.status(400).json({ error: 'You cannot request your own item' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Item is not available' });

    // Ensure there is no active request.
    const existing = await DonationRequest.findOne({ itemId, status: { $in: ['pending', 'accepted'] } }).lean();
    if (existing) return res.status(400).json({ error: 'This item is already on hold' });

    const id = crypto.randomUUID();
    const created = await DonationRequest.create({
      id,
      itemId,
      itemTitle: item.title,
      itemImage: item.images?.[0] || '',
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      ownerEmail: item.ownerEmail || '',
      requesterId: req.user.id,
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      status: 'pending',
      messages: [],
    });

    // Put item on hold.
    item.status = 'hold';
    item.holdBy = req.user.id;
    item.holdByName = req.user.name;
    item.holdRequestId = created.id;
    item.holdAt = new Date();
    await item.save();

    res.status(201).json(created);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create donation request' });
  }
});

// PATCH /api/donations/requests/:id/respond
// Owner accepts/denies a request.
router.patch('/requests/:id/respond', requireAuth(), async (req, res) => {
  try {
    const { accept } = req.body || {};
    const request = await DonationRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can respond' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    request.status = accept ? 'accepted' : 'denied';
    request.respondedAt = new Date();
    await request.save();

    const item = await Item.findOne({ id: request.itemId });
    if (item) {
      if (accept) {
        // Keep item on hold.
        item.status = 'hold';
        item.holdBy = request.requesterId;
        item.holdByName = request.requesterName;
        item.holdRequestId = request.id;
        if (!item.holdAt) item.holdAt = new Date();
      } else {
        // Release hold.
        item.status = 'available';
        item.holdBy = '';
        item.holdByName = '';
        item.holdRequestId = '';
        item.holdAt = undefined;
      }
      await item.save();
    }

    res.json(request.toObject ? request.toObject() : request);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to respond to donation request' });
  }
});

// POST /api/donations/requests/:id/messages
// Chat messages (allowed after accept).
router.post('/requests/:id/messages', requireAuth(), async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });

    const request = await DonationRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const isParticipant = request.ownerId === req.user.id || request.requesterId === req.user.id;
    if (!isParticipant) return res.status(403).json({ error: 'Not allowed' });
    if (request.status !== 'accepted') {
      return res.status(400).json({ error: 'Chat is available after the owner accepts the request' });
    }

    request.messages.push({
      senderId: req.user.id,
      senderName: req.user.name,
      text: String(text).trim(),
      createdAt: new Date(),
    });
    await request.save();
    res.status(201).json(request.toObject ? request.toObject() : request);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /api/donations/requests/:id/complete
// Owner confirms the donation is completed.
router.patch('/requests/:id/complete', requireAuth(), async (req, res) => {
  try {
    const request = await DonationRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can complete' });
    if (request.status !== 'accepted') return res.status(400).json({ error: 'Request must be accepted first' });

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    const item = await Item.findOne({ id: request.itemId });
    if (item) {
      item.status = 'taken';
      item.claimedBy = request.requesterId;
      item.claimedByName = request.requesterName;
      item.claimedAt = new Date();
      item.holdBy = '';
      item.holdByName = '';
      item.holdRequestId = '';
      item.holdAt = undefined;
      await item.save();

      // Award donor point to the owner on completion.
      const owner = await User.findOne({ id: item.ownerId });
      if (owner) {
        owner.donorPoints = Number(owner.donorPoints || 0) + 1;
        owner.badge = getBadgeFromPoints(owner.donorPoints);
        await owner.save();
      }
    }

    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to complete donation' });
  }
});

// Convenience: get updated item for a request
router.get('/requests/:id/item', requireAuth(), async (req, res) => {
  try {
    const request = await DonationRequest.findOne({ id: req.params.id }).lean();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const isParticipant = request.ownerId === req.user.id || request.requesterId === req.user.id;
    if (!isParticipant) return res.status(403).json({ error: 'Not allowed' });
    const item = await Item.findOne({ id: request.itemId }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(toClientItem(item));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

export default router;
