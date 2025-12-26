import express from 'express';

import { User } from '../models/User.js';
import { requireAuth } from '../lib/auth.js';
import { toClientUser } from '../lib/serializers.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth(), async (req, res) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toClientUser(user));
});

// PATCH /api/users/me
router.patch('/me', requireAuth(), async (req, res) => {
  const updates = {};
  if (typeof req.body?.name === 'string') {
    updates.name = req.body.name.trim();
  }
  if (typeof req.body?.avatar === 'string') {
    updates.avatar = req.body.avatar.trim();
  }

  const user = await User.findOneAndUpdate(
    { id: req.user.id },
    { $set: updates },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toClientUser(user));
});

export default router;
