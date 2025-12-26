import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { signToken } from '../lib/auth.js';
import { getBadgeFromPoints } from '../lib/badges.js';
import { toClientUser } from '../lib/serializers.js';

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isStrongEnoughPassword(password) {
  // Keep it permissive for demo use.
  return typeof password === 'string' && password.length >= 4;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!name || !email || !isStrongEnoughPassword(password)) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      id,
      name,
      email,
      passwordHash,
      avatar: '',
      donorPoints: 0,
      badge: getBadgeFromPoints(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = signToken(created);
    res.json({ token, user: toClientUser(created) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const allowAutoCreate = String(process.env.ALLOW_AUTO_CREATE || 'true') === 'true';

    let user = await User.findOne({ email });
    if (!user) {
      if (!allowAutoCreate) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      // Demo-friendly: auto-create user on first login.
      const id = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      const name = email.split('@')[0] || 'User';
      user = await User.create({
        id,
        name,
        email,
        passwordHash,
        avatar: '',
        donorPoints: 0,
        badge: getBadgeFromPoints(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const token = signToken(user);
    res.json({ token, user: toClientUser(user) });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

export default router;
