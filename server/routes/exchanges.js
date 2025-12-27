import express from 'express';
import crypto from 'crypto';

import { requireAuth } from '../lib/auth.js';
import { ExchangeRequest } from '../models/ExchangeRequest.js';
import { Item } from '../models/Item.js';
import { toClientExchange } from '../lib/serializers.js';

const router = express.Router();

function isOwnerForRequest(reqUser, request) {
  const byId = request.ownerId && request.ownerId === reqUser.id;
  const byEmail =
    request.ownerEmail && reqUser.email && request.ownerEmail.toLowerCase() === reqUser.email.toLowerCase();
  return byId || byEmail;
}

function isParticipant(reqUser, request) {
  const idMatch = request.ownerId === reqUser.id || request.requesterId === reqUser.id;
  const emailMatch =
    (request.ownerEmail && reqUser.email && request.ownerEmail.toLowerCase() === reqUser.email.toLowerCase()) ||
    (request.requesterEmail && reqUser.email && request.requesterEmail.toLowerCase() === reqUser.email.toLowerCase());
  return idMatch || emailMatch;
}

async function releaseHoldForItem(itemId) {
  const item = await Item.findOne({ id: itemId });
  if (!item) return;
  if (item.status === 'hold' || item.status === 'pending') {
    item.status = 'available';
  }
  item.holdBy = '';
  item.holdByName = '';
  item.holdRequestId = '';
  item.holdAt = undefined;
  await item.save();
}

async function applyHoldToItem(item, holdById, holdByName, requestId) {
  item.status = 'hold';
  item.holdBy = holdById;
  item.holdByName = holdByName;
  item.holdRequestId = requestId;
  item.holdAt = new Date();
  await item.save();
}

// GET /api/exchanges -> returns both incoming and outgoing for the current user
router.get('/', requireAuth(), async (req, res) => {
  try {
    const uid = req.user.id;
    const email = req.user.email || '';
    const reqs = await ExchangeRequest.find({
      $or: [{ ownerId: uid }, { requesterId: uid }, { ownerEmail: email }, { requesterEmail: email }],
    }).sort({ updatedAt: -1 });

    res.json(reqs.map(toClientExchange));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch exchange requests' });
  }
});

// POST /api/exchanges
// Body: { itemId: string, offeredItemIds: string[], note?: string }
// Puts the requested item on hold, and also holds offered items until the owner selects one.
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { itemId, offeredItemIds, note } = req.body || {};
    const offeredIds = Array.isArray(offeredItemIds) ? offeredItemIds.filter(Boolean) : [];

    if (!itemId || offeredIds.length < 1) {
      return res.status(400).json({ error: 'itemId and offeredItemIds are required' });
    }
    if (offeredIds.length > 4) {
      return res.status(400).json({ error: 'You can offer at most 4 items' });
    }

    const item = await Item.findOne({ id: itemId });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.ownerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot request your own item' });
    }
    if (item.type !== 'exchange') {
      return res.status(400).json({ error: 'This item is not available for exchange' });
    }
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'This item is not currently available' });
    }

    // Load offered items (must belong to requester and be available exchange items).
    const offered = await Item.find({ id: { $in: offeredIds } });
    const offeredById = new Map(offered.map((o) => [o.id, o]));
    if (offeredById.size !== offeredIds.length) {
      return res.status(400).json({ error: 'One or more offered items were not found' });
    }
    for (const oid of offeredIds) {
      const o = offeredById.get(oid);
      if (!o) continue;
      if (o.ownerId !== req.user.id) {
        return res.status(400).json({ error: 'You can only offer items you own' });
      }
      if (o.type !== 'exchange') {
        return res.status(400).json({ error: 'You can only offer items marked for exchange' });
      }
      if (o.status !== 'available') {
        return res.status(400).json({ error: `Offered item "${o.title}" is not available` });
      }
    }

    const requestId = crypto.randomUUID();

    const offeredSnapshots = offeredIds.map((oid) => {
      const o = offeredById.get(oid);
      return {
        id: oid,
        title: o?.title || '',
        image: o?.images?.[0] || '',
        category: o?.category || '',
        type: o?.type || '',
      };
    });

    const created = await ExchangeRequest.create({
      id: requestId,
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images?.[0] || '',
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      ownerEmail: item.ownerEmail || '',
      requesterId: req.user.id,
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      offeredItemIds: offeredIds,
      offeredItems: offeredSnapshots,
      note: typeof note === 'string' ? note : '',
      status: 'pending',
      messages: [],
    });

    // Hold requested item
    await applyHoldToItem(item, req.user.id, req.user.name, requestId);

    // Hold offered items until owner selects one (prevents offering same item in multiple requests)
    for (const oid of offeredIds) {
      const o = offeredById.get(oid);
      if (o) {
        await applyHoldToItem(o, req.user.id, req.user.name, requestId);
      }
    }

    res.status(201).json(toClientExchange(created));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create exchange request' });
  }
});

// PATCH /api/exchanges/:id/respond
// Body: { accept: boolean, selectedOfferedItemId?: string }
router.patch('/:id/respond', requireAuth(), async (req, res) => {
  try {
    const accept = !!req.body?.accept;
    const selectedOfferedItemId = String(req.body?.selectedOfferedItemId || '');

    const request = await ExchangeRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (!isOwnerForRequest(req.user, request)) {
      return res.status(403).json({ error: 'Only owner can accept or deny' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    // Self-heal ownerId when email matches (helps when a user was re-created/re-seeded).
    if (request.ownerId !== req.user.id && request.ownerEmail && req.user.email &&
        request.ownerEmail.toLowerCase() === req.user.email.toLowerCase()) {
      request.ownerId = req.user.id;
      request.ownerName = req.user.name;
      await request.save();
    }

    const item = await Item.findOne({ id: request.itemId });
    if (!item) return res.status(404).json({ error: 'Requested item not found' });

    if (accept) {
      if (!selectedOfferedItemId) {
        return res.status(400).json({ error: 'selectedOfferedItemId is required to accept' });
      }
      if (!request.offeredItemIds.includes(selectedOfferedItemId)) {
        return res.status(400).json({ error: 'Selected item must be one of the offered items' });
      }

      const selected = await Item.findOne({ id: selectedOfferedItemId });
      if (!selected) return res.status(404).json({ error: 'Selected offered item not found' });

      request.status = 'accepted';
      request.respondedAt = new Date();
      request.selectedOfferedItemId = selected.id;
      request.selectedOfferedItemTitle = selected.title;
      request.selectedOfferedItemImage = selected.images?.[0] || '';
      await request.save();

      // Keep requested item on hold, but ensure it is linked to this request id
      await applyHoldToItem(item, request.requesterId, request.requesterName, request.id);

      // Release holds for all offered items except the selected one
      for (const oid of request.offeredItemIds) {
        if (oid === selected.id) {
          // Keep selected offered item on hold until completion
          await applyHoldToItem(selected, request.requesterId, request.requesterName, request.id);
        } else {
          await releaseHoldForItem(oid);
        }
      }
    } else {
      request.status = 'denied';
      request.respondedAt = new Date();
      await request.save();

      // Release requested item and all offered items
      await releaseHoldForItem(request.itemId);
      for (const oid of request.offeredItemIds) {
        await releaseHoldForItem(oid);
      }
    }

    res.json(toClientExchange(request));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to respond to exchange request' });
  }
});

// POST /api/exchanges/:id/messages
// Chat is available after acceptance.
router.post('/:id/messages', requireAuth(), async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });

    const request = await ExchangeRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!isParticipant(req.user, request)) return res.status(403).json({ error: 'Not allowed' });
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

    res.status(201).json(toClientExchange(request));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /api/exchanges/:id/complete
// Owner confirms the exchange is completed.
router.patch('/:id/complete', requireAuth(), async (req, res) => {
  try {
    const request = await ExchangeRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (!isOwnerForRequest(req.user, request)) {
      return res.status(403).json({ error: 'Only owner can complete' });
    }
    if (request.status !== 'accepted') return res.status(400).json({ error: 'Request must be accepted first' });

    // Self-heal ownerId when email matches
    if (request.ownerId !== req.user.id && request.ownerEmail && req.user.email &&
        request.ownerEmail.toLowerCase() === req.user.email.toLowerCase()) {
      request.ownerId = req.user.id;
      request.ownerName = req.user.name;
    }

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    const requestedItem = await Item.findOne({ id: request.itemId });
    const offeredItem = request.selectedOfferedItemId
      ? await Item.findOne({ id: request.selectedOfferedItemId })
      : null;

    if (requestedItem) {
      requestedItem.status = 'taken';
      requestedItem.claimedBy = request.requesterId;
      requestedItem.claimedByName = request.requesterName;
      requestedItem.claimedAt = new Date();
      requestedItem.holdBy = '';
      requestedItem.holdByName = '';
      requestedItem.holdRequestId = '';
      requestedItem.holdAt = undefined;
      await requestedItem.save();
    }

    if (offeredItem) {
      offeredItem.status = 'taken';
      offeredItem.claimedBy = request.ownerId;
      offeredItem.claimedByName = request.ownerName;
      offeredItem.claimedAt = new Date();
      offeredItem.holdBy = '';
      offeredItem.holdByName = '';
      offeredItem.holdRequestId = '';
      offeredItem.holdAt = undefined;
      await offeredItem.save();
    }

    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to complete exchange' });
  }
});

export default router;
