import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { Item } from '../models/Item.js';
import { toClientItem } from '../lib/serializers.js';

const router = express.Router();

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  let hit = 0;
  for (const t of bTokens) if (a.has(t)) hit += 1;
  return hit;
}

function buildUserProfile(owned, collected) {
  const categoryCount = new Map();
  const tagCount = new Map();
  const titleTokens = new Map();

  const add = (item, w) => {
    if (!item) return;
    categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + w);
    for (const tag of item.tags || []) {
      const k = String(tag || '').toLowerCase();
      tagCount.set(k, (tagCount.get(k) || 0) + w);
    }
    for (const tok of tokenize(item.title)) {
      titleTokens.set(tok, (titleTokens.get(tok) || 0) + w);
    }
  };

  // Owned items show what the user has / shares; collected items show preference, weight more.
  for (const it of owned) add(it, 1);
  for (const it of collected) add(it, 2);

  const topCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map((x) => x[0]);

  return { topCategories, topTags, titleTokens };
}

function scoreCandidate(profile, candidate) {
  let score = 0;

  if (profile.topCategories.includes(candidate.category)) score += 3;

  const cTags = (candidate.tags || []).map((t) => String(t || '').toLowerCase());
  for (const t of cTags) {
    if (profile.topTags.includes(t)) score += 1.5;
  }

  // Token overlap with user's interest tokens
  const userTokSet = new Set(profile.titleTokens.keys());
  const cToks = tokenize(candidate.title).concat(tokenize(candidate.description));
  for (const tok of cToks) {
    if (userTokSet.has(tok)) score += 0.35;
  }

  // Small boost for exchange items (encourages trading) if user has exchange history
  if (candidate.type === 'exchange') score += 0.25;

  return score;
}

// GET /api/ai/suggestions
// Returns a list of recommended items for the current user (simple content-based "AI" suggestions).
router.get('/suggestions', requireAuth(), async (req, res) => {
  try {
    const uid = req.user.id;

    const all = await Item.find({ status: { $ne: 'taken' } }).lean();

    const owned = all.filter((i) => i.ownerId === uid);
    const collected = all.filter((i) => i.claimedBy === uid);

    const profile = buildUserProfile(owned, collected);

    const candidates = all.filter((i) => i.ownerId !== uid && i.status === 'available');

    const ranked = candidates
      .map((c) => ({ c, score: scoreCandidate(profile, c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.c);

    res.json(ranked.map(toClientItem));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to build AI suggestions' });
  }
});

// GET /api/ai/exchange-offers?targetItemId=...
// Suggest up to 4 of the user's exchange items to offer for a target item.
router.get('/exchange-offers', requireAuth(), async (req, res) => {
  try {
    const uid = req.user.id;
    const targetId = String(req.query.targetItemId || '');
    if (!targetId) return res.status(400).json({ error: 'targetItemId is required' });

    const target = await Item.findOne({ id: targetId }).lean();
    if (!target) return res.status(404).json({ error: 'Target item not found' });

    const myItems = await Item.find({ ownerId: uid, type: 'exchange', status: 'available' }).lean();
    if (!myItems.length) return res.json({ items: [], reason: 'No available exchange items' });

    // Use user's collected items as preference (items they claimed).
    const collected = await Item.find({ claimedBy: uid }).lean();
    const profile = buildUserProfile(myItems, collected);

    const targetTokens = tokenize(target.title).concat(tokenize(target.description));
    const targetTags = new Set((target.tags || []).map((t) => String(t || '').toLowerCase()));

    // Offer items that are:
    // - reasonably related to target (to feel fair)
    // - BUT not strongly aligned with user's own top preferences (so they're easier to give away)
    const scored = myItems.map((it) => {
      const itTokens = tokenize(it.title).concat(tokenize(it.description));
      const related = overlapScore(targetTokens, itTokens);
      const tagOverlap = (it.tags || []).reduce((acc, t) => acc + (targetTags.has(String(t || '').toLowerCase()) ? 1 : 0), 0);

      // Preference score (higher means user likely likes it)
      let pref = 0;
      if (profile.topCategories.includes(it.category)) pref += 2;
      for (const tag of it.tags || []) {
        if (profile.topTags.includes(String(tag || '').toLowerCase())) pref += 1;
      }

      // Final: prefer higher relatedness and lower preference
      const score = related * 1.2 + tagOverlap * 2.0 - pref * 1.1;

      return { id: it.id, score, title: it.title };
    });

    const top = scored.sort((a, b) => b.score - a.score).slice(0, 4).map((x) => x.id);

    res.json({
      items: top,
      reason:
        'Suggested offers are chosen using a content-based scoring model using your uploaded items and your previously collected items.',
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to suggest exchange offers' });
  }
});

export default router;
